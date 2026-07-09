import unittest
import os
import sys

# Add current folder to sys path to import services correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.state import stadium_state
from services.rag import query_stadium_docs, seed_database
from services.agents import detect_and_execute_tools, generate_streaming_response

class TestCopilotSystem(unittest.TestCase):
    
    def setUp(self):
        # Setup clean test state base values
        stadium_state["volunteers"] = 100
        stadium_state["incidents"] = []
        stadium_state["orders"] = []

    def test_rag_seeding_and_retrieval(self):
        """
        Verify that RAG documents are seeded and can be queried.
        """
        seed_database()
        # Query for emergency evac manual
        results = query_stadium_docs("evacuation routes")
        self.assertTrue(len(results) > 0)
        self.assertIn("Evacuation", results[0]["text"] + results[0]["title"])

    def test_tool_calling_food_orders(self):
        """
        Verify that ordering keywords execute order concessions tools on state.
        """
        res = detect_and_execute_tools("Please order burger at Seat 42F")
        actions = res.get("actions", [])
        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["action"], "order_food")
        self.assertTrue(len(stadium_state["orders"]) > 0)
        self.assertEqual(stadium_state["orders"][0]["item"], "Classic Burger Combo")

    def test_tool_calling_volunteer_dispatch(self):
        """
        Verify that dispatching volunteers creates a new task in operations.
        """
        res = detect_and_execute_tools("Deploy 12 volunteers to Gate 4")
        actions = res.get("actions", [])
        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["action"], "deploy_volunteers")
        # Check task list
        self.assertTrue(len(stadium_state["tasks"]) > 0)
        self.assertIn("Deploy 12 volunteers", stadium_state["tasks"][0]["title"])

    def test_tool_calling_sos_emergency(self):
        """
        Verify that SOS signals log critical incidents and alert emergency units.
        """
        res = detect_and_execute_tools("Help me, there is an emergency SOS alert at Gate 1")
        actions = res.get("actions", [])
        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["action"], "trigger_sos")
        # Verify critical incident was logged
        self.assertTrue(len(stadium_state["incidents"]) > 0)
        self.assertEqual(stadium_state["incidents"][0]["severity"], "CRITICAL")

    def test_explainable_ai_simulation_streaming(self):
        """
        Verify that the streaming response output contains the Explainable AI report block.
        """
        tokens = list(generate_streaming_response("Show crowd density info", role="Organizer"))
        self.assertTrue(len(tokens) > 0)
        full_text = "".join(tokens)
        self.assertIn("🎯 AI RECOMMENDATION REPORT", full_text)
        self.assertIn("Confidence Score:", full_text)
        self.assertIn("Expected Impact:", full_text)

if __name__ == "__main__":
    unittest.main()
