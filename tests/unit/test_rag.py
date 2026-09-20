"""
Unit Tests for AccessBridge Grounded RAG Pipeline
"""

import pytest
from backend.rag.store import RAGStore

def test_rag_retrieves_wcag_guidance():
    store = RAGStore.get_instance()
    results = store.search("form label input error", k=3)
    assert len(results) > 0
    top = results[0]
    assert top.rule_id != ""
    assert top.source != ""
    assert top.text != ""
    assert top.retrieval_score > 0.0

def test_rag_retrieves_error_prevention_for_submit():
    store = RAGStore.get_instance()
    results = store.search("submit form confirmation review error prevention", k=3)
    rule_ids = [r.rule_id for r in results]
    assert "WCAG-3.3.4" in rule_ids

def test_rag_retrieves_coga_plain_language():
    store = RAGStore.get_instance()
    results = store.search("cognitive simplified plain language understand", k=3)
    rule_ids = [r.rule_id for r in results]
    assert any("COGA" in r for r in rule_ids)

def test_empty_query_returns_empty():
    store = RAGStore.get_instance()
    assert store.search("") == []
