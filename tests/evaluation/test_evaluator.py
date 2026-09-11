"""
Pytest wrapper for AccessBridge Gold Benchmark Evaluation
"""

import pytest
import asyncio
from scripts.run_eval import run_evaluation

@pytest.mark.asyncio
async def test_gold_scenarios_benchmark():
    success = await run_evaluation()
    assert success is True
