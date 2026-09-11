"""
RAG Store for AccessBridge
Integrates ChromaDB with a lightweight offline embedding function for instant, deterministic vector retrieval.
Includes source metadata, WCAG 2.2 principles, and cosine similarity ranking.
"""

import math
import hashlib
from typing import List, Dict, Any, Optional
from backend.models.schemas import RAGCitation
from backend.rag.knowledge_data import KNOWLEDGE_DOCUMENTS
from backend.config import settings

class OfflineHashedEmbeddingFunction:
    """
    Deterministic 384-dimensional embedding function for ChromaDB.
    Runs 100% offline with zero external downloads while preserving semantic vector math.
    """
    @staticmethod
    def name() -> str:
        return "offline_hashed_embedding_function"

    def get_config(self) -> Dict[str, Any]:
        return {}

    @staticmethod
    def supported_spaces() -> List[str]:
        return ["cosine", "l2", "ip"]

    @staticmethod
    def default_space() -> str:
        return "cosine"

    @staticmethod
    def is_legacy() -> bool:
        return False

    def __call__(self, input: List[str]) -> List[List[float]]:
        embeddings = []
        for text in input:
            tokens = text.lower().split()
            # 384-dim vector initialized to 0
            vec = [0.0] * 384
            for token in tokens:
                # Hash token into index
                h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
                idx = h % 384
                sign = 1.0 if (h >> 9) % 2 == 0 else -1.0
                vec[idx] += sign * (1.0 + math.log(1.0 + len(token)))

            # L2 normalize
            norm = math.sqrt(sum(x * x for x in vec))
            if norm > 0:
                vec = [x / norm for x in vec]
            embeddings.append(vec)
        return embeddings

class RAGStore:
    _instance = None

    def __init__(self):
        self.documents = KNOWLEDGE_DOCUMENTS
        self.chroma_collection = None
        self._init_chroma()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = RAGStore()
        return cls._instance

    def _init_chroma(self):
        try:
            import chromadb
            client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
            emb_fn = OfflineHashedEmbeddingFunction()
            self.chroma_collection = client.get_or_create_collection(
                name="accessbridge_wcag_guidance",
                embedding_function=emb_fn
            )
            # Seed if empty
            if self.chroma_collection.count() == 0:
                ids = [doc["rule_id"] for doc in self.documents]
                texts = [f"{doc['section']}: {doc['text']} Keywords: {' '.join(doc['keywords'])}" for doc in self.documents]
                metadatas = [
                    {
                        "rule_id": doc["rule_id"],
                        "source": doc["source"],
                        "section": doc["section"],
                        "keywords": ",".join(doc["keywords"])
                    }
                    for doc in self.documents
                ]
                self.chroma_collection.add(
                    ids=ids,
                    documents=texts,
                    metadatas=metadatas
                )
        except Exception:
            self.chroma_collection = None

    def search(self, query: str, k: int = 3, threshold: float = 0.25) -> List[RAGCitation]:
        query_clean = query.lower().strip()
        if not query_clean:
            return []

        # 1. Try ChromaDB vector query
        if self.chroma_collection:
            try:
                results = self.chroma_collection.query(
                    query_texts=[query_clean],
                    n_results=k
                )
                citations = []
                if results and results.get("documents") and results["documents"][0]:
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    distances = results.get("distances", [[0.2] * len(docs)])[0]
                    for i, doc_text in enumerate(docs):
                        meta = metas[i]
                        dist = distances[i] if i < len(distances) else 0.5
                        score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                        if score >= threshold:
                            citations.append(RAGCitation(
                                rule_id=meta.get("rule_id", ""),
                                source=meta.get("source", ""),
                                section=meta.get("section", ""),
                                text=doc_text,
                                retrieval_score=round(score, 3)
                            ))
                    if citations:
                        return citations
            except Exception:
                pass

        # 2. Resilient Keyword + Jaccard Semantic Ranker
        query_tokens = set(query_clean.split())
        scored_docs = []

        for doc in self.documents:
            doc_text = f"{doc['rule_id']} {doc['source']} {doc['section']} {doc['text']} {' '.join(doc['keywords'])}".lower()
            doc_tokens = set(doc_text.split())

            kw_hits = sum(1 for kw in doc["keywords"] if kw in query_clean)
            token_overlap = len(query_tokens.intersection(doc_tokens))
            jaccard = token_overlap / max(1, len(query_tokens.union(doc_tokens)))
            score = (kw_hits * 0.3) + (jaccard * 0.5) + (0.2 if any(t in doc_text for t in query_tokens) else 0.0)
            score = min(0.99, max(0.0, score))

            if score >= threshold:
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        top_k = scored_docs[:k]

        return [
            RAGCitation(
                rule_id=d["rule_id"],
                source=d["source"],
                section=d["section"],
                text=d["text"],
                retrieval_score=round(s, 3)
            )
            for s, d in top_k
        ]
