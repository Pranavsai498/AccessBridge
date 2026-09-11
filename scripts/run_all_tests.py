"""
Unified Test Runner for AccessBridge
Executes all 5 test suites (Unit, Integration, 25 Gold Scenarios, Red-Team, Accessibility)
and prints a consolidated summary report.
"""

import subprocess
import sys
import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_OPTOUT"] = "True"
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def run_suite(title: str, cmd: list) -> bool:
    print("\n" + "=" * 65)
    print(f"  RUNNING: {title}")
    print("=" * 65)
    res = subprocess.run(cmd, cwd=str(BASE_DIR))
    return res.returncode == 0

def main():
    print("\n=================================================================")
    print("      ACCESSBRIDGE COMPREHENSIVE TEST & VERIFICATION SUITE       ")
    print("=================================================================")

    suites = [
        ("Unit Tests (Confidence, RAG, MCP, Agents)", [sys.executable, "-m", "pytest", "tests/unit", "-v"]),
        ("Integration Tests (LangGraph Workflow & Playwright)", [sys.executable, "-m", "pytest", "tests/integration", "-v"]),
        ("25 Gold Benchmark Evaluation Scenarios", [sys.executable, "scripts/run_eval.py"]),
        ("Red-Team Adversarial Test Suite", [sys.executable, "-m", "pytest", "tests/redteam", "-v"]),
        ("Accessibility (WCAG 2.2 AA) Compliance Tests", [sys.executable, "-m", "pytest", "tests/accessibility", "-v"])
    ]

    results = []
    all_passed = True

    for name, cmd in suites:
        passed = run_suite(name, cmd)
        results.append((name, passed))
        if not passed:
            all_passed = False

    print("\n" + "=" * 65)
    print("  FINAL CONSOLIDATED TEST RESULTS")
    print("=" * 65)
    for name, passed in results:
        status = "[PASSED]" if passed else "[FAILED]"
        print(f" {status:<8} : {name}")
    print("=" * 65)

    if all_passed:
        print("ALL TEST SUITES PASSED! System verified and ready for hackathon submission.\n")
        sys.exit(0)
    else:
        print("SOME TESTS FAILED! Please inspect test logs above.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
