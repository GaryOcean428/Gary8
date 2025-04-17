"""
advanced_router.py: Implements the AdvancedRouter class for dynamic model and strategy selection.
"""

from typing import Dict, Any, List
import re
import logging
from config import ROUTER_THRESHOLD, HIGH_TIER_MODEL, MID_TIER_MODEL, LOW_TIER_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AdvancedRouter:
    """
    A class that determines the best model, parameters, and response strategy
    for a given query and conversation history.
    """

    def __init__(self):
        self.threshold = ROUTER_THRESHOLD
        self.models = {
            "low": LOW_TIER_MODEL,
            "mid": MID_TIER_MODEL,
            "high": HIGH_TIER_MODEL,
            "superior": HIGH_TIER_MODEL,  # Using HIGH_TIER_MODEL for both high and superior
        }

    def route(
        self, query: str, conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Determine the best model, parameters, and response strategy for the given query and conversation history.

        Args:
            query (str): The user's input query.
            conversation_history (List[Dict[str, str]]): The conversation history.

        Returns:
            Dict[str, Any]: A dictionary containing the routing decision.
        """
        complexity = self._assess_complexity(query)
        context_length = self._calculate_context_length(conversation_history)
        task_type = self._identify_task_type(query)
        question_type = self._classify_question(query)

        # Handle simple queries
        if task_type == "casual":
            return self._get_casual_config()

        if complexity < self.threshold / 2 and context_length < 1000:
            config = self._get_low_tier_config(task_type)
        elif complexity < self.threshold and context_length < 4000:
            config = self._get_mid_tier_config(task_type)
        elif complexity < self.threshold * 1.5 or context_length < 8000:
            config = self._get_high_tier_config(task_type)
        else:
            config = self._get_superior_tier_config(task_type)

        config["routing_explanation"] = (
            f"Selected {config['model']} based on complexity ({complexity:.2f}) "
            f"and context length ({context_length} chars). Threshold: {self.threshold}"
        )
        config["question_type"] = question_type
        config["response_strategy"] = self._get_response_strategy(
            question_type, task_type
        )

        config = self._adjust_params_based_on_history(config, conversation_history)

        logger.info("Routing decision: %s", config)
        return config

    def _assess_complexity(self, query: str) -> float:
        """
        Assess the complexity of the query on a scale of 0 to 1.

        Args:
            query (str): The user's input query.

        Returns:
            float: The assessed complexity score.
        """
        word_count = len(query.split())
        sentence_count = len(re.findall(r"\w+[.!?]", query)) + 1
        avg_word_length = (
            sum(len(word) for word in query.split()) / word_count
            if word_count > 0
            else 0
        )

        complexity = (
            (word_count / 100) * 0.4
            + (sentence_count / 10) * 0.3
            + (avg_word_length / 10) * 0.3
        )
        return min(complexity, 1.0)

    def _calculate_context_length(
        self, conversation_history: List[Dict[str, str]]
    ) -> int:
        """
        Calculate the total length of the conversation history.

        Args:
            conversation_history (List[Dict[str, str]]): The conversation history.

        Returns:
            int: The total length of the conversation history in characters.
        """
        return sum(len(message["content"]) for message in conversation_history)

    def _identify_task_type(self, query: str) -> str:
        """
        Identify the type of task based on the query.

        Args:
            query (str): The user's input query.

        Returns:
            str: The identified task type.
        """
        query_lower = query.lower()
        if any(
            word in query_lower for word in ["code", "program", "function", "debug"]
        ):
            return "coding"
        elif any(word in query_lower for word in ["analyze", "compare", "evaluate"]):
            return "analysis"
        elif any(word in query_lower for word in ["create", "generate", "write"]):
            return "creative"
        elif any(word in query_lower for word in ["hi", "hello", "hey", "how are you"]):
            return "casual"
        else:
            return "general"

    def _classify_question(self, query: str) -> str:
        """
        Classify the type of question.

        Args:
            query (str): The user's input query.

        Returns:
            str: The classified question type.
        """
        query_lower = query.lower()
        if any(word in query_lower for word in ["how", "why", "explain"]):
            return "problem_solving"
        elif any(word in query_lower for word in ["what", "who", "where", "when"]):
            return "factual"
        elif query_lower.startswith(("is", "are", "can", "do", "does")):
            return "yes_no"
        elif any(word in query_lower for word in ["compare", "contrast", "analyze"]):
            return "analysis"
        elif any(word in query_lower for word in ["hi", "hello", "hey", "how are you"]):
            return "casual"
        else:
            return "open_ended"

    def _get_response_strategy(self, question_type: str, task_type: str) -> str:
        """
        Determine the appropriate response strategy based on question type and task type.

        Args:
            question_type (str): The type of question.
            task_type (str): The type of task.

        Returns:
            str: The selected response strategy.
        """
        if task_type == "casual" or question_type == "casual":
            return "casual_conversation"

        strategy_map = {
            "problem_solving": "chain_of_thought",
            "factual": "direct_answer",
            "yes_no": "boolean_with_explanation",
            "analysis": "comparative_analysis",
            "open_ended": "open_discussion",
        }
        return strategy_map.get(question_type, "default")

    def _get_casual_config(self) -> Dict[str, Any]:
        """
        Get configuration for casual task processing.

        Returns:
            Dict[str, Any]: Configuration for casual task.
        """
        return {
            "model": self.models["low"],
            "max_tokens": 50,
            "temperature": 0.7,
            "response_strategy": "casual_conversation",
            "routing_explanation": "Simple greeting detected, using low-tier model for quick response.",
        }

    def _get_low_tier_config(self, task_type: str) -> Dict[str, Any]:
        """
        Get configuration for low-tier model processing.

        Args:
            task_type (str): The type of task.

        Returns:
            Dict[str, Any]: Configuration for low-tier model.
        """
        config = {
            "model": self.models["low"],
            "max_tokens": 256,
            "temperature": 0.5,
        }
        if task_type == "casual":
            config["temperature"] = (
                0.7  # Increase temperature for more varied casual responses
            )
        return config

    def _get_mid_tier_config(self, task_type: str) -> Dict[str, Any]:
        """
        Get configuration for mid-tier model processing.

        Args:
            task_type (str): The type of task.

        Returns:
            Dict[str, Any]: Configuration for mid-tier model.
        """
        config = {
            "model": self.models["mid"],
            "max_tokens": 512,
            "temperature": 0.7,
        }
        if task_type in ["analysis", "creative"]:
            # Increase token limit for more complex tasks
            config["max_tokens"] = 768
        return config

    def _get_high_tier_config(self, task_type: str) -> Dict[str, Any]:
        """
        Get configuration for high-tier model processing.

        Args:
            task_type (str): The type of task.

        Returns:
            Dict[str, Any]: Configuration for high-tier model.
        """
        config = {
            "model": self.models["high"],
            "max_tokens": 1024,
            "temperature": 0.9,
        }
        if task_type in ["coding", "analysis"]:
            # Lower temperature for more precise outputs
            config["temperature"] = 0.7
        return config

    def _get_superior_tier_config(self, task_type: str) -> Dict[str, Any]:
        """
        Get configuration for superior-tier model processing.

        Args:
            task_type (str): The type of task.

        Returns:
            Dict[str, Any]: Configuration for superior-tier model.
        """
        config = {
            "model": self.models["superior"],
            "max_tokens": 8192,  # Maximum available for the highest tier model
            "temperature": 0.7,
        }
        if task_type in ["coding", "analysis"]:
            # Lower temperature for more precise outputs
            config["temperature"] = 0.5
        return config

    def _adjust_params_based_on_history(
        self, config: Dict[str, Any], conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Adjust parameters based on conversation history.

        Args:
            config (Dict[str, Any]): The current configuration.
            conversation_history (List[Dict[str, str]]): The conversation history.

        Returns:
            Dict[str, Any]: The adjusted configuration.
        """
        if len(conversation_history) > 5:
            # For longer conversations, slightly increase temperature for more varied responses
            config["temperature"] = min(config["temperature"] * 1.1, 1.0)

        if any(
            msg["content"].lower().startswith("please explain")
            for msg in conversation_history[-3:]
        ):
            config["max_tokens"] = min(int(config["max_tokens"] * 1.2), 8192)

        # Check for rapid back-and-forth exchanges
        if len(conversation_history) >= 4 and all(
            len(msg["content"].split()) < 10 for msg in conversation_history[-4:]
        ):
            config["max_tokens"] = max(
                128, int(config["max_tokens"] * 0.8)
            )  # Reduce max_tokens for quicker responses

        return config


advanced_router = AdvancedRouter()


calibrate_threshold.py
"""
Calibration script to find the optimal threshold for the AdvancedRouter in Chat99.
"""

import argparse
import json
from typing import List, Dict
from advanced_router import advanced_router


def load_sample_queries(file_path: str) -> List[Dict[str, str]]:
    """Load sample queries from a JSON file."""
    with open(file_path, "r") as f:
        return json.load(f)


def calibrate_threshold(
    router: advanced_router, queries: List[Dict[str, str]], target_strong_pct: float
) -> float:
    """
    Calibrate the complexity threshold for the AdvancedRouter.
    """
    complexities = [router._assess_complexity(query["content"]) for query in queries]
    strong_model_calls = sum(
        1 for complexity in complexities if complexity >= router.threshold
    )
    actual_strong_pct = strong_model_calls / len(queries)

    if actual_strong_pct < target_strong_pct:
        return min(
            router.threshold * 0.9, 0.9
        )  # Lower threshold to increase strong model usage
    elif actual_strong_pct > target_strong_pct:
        return max(
            router.threshold * 1.1, 0.1
        )  # Raise threshold to decrease strong model usage
    else:
        return router.threshold  # Keep current threshold


def main():
    parser = argparse.ArgumentParser(
        description="Calibrate AdvancedRouter threshold for Chat99"
    )
    parser.add_argument(
        "--sample-queries",
        type=str,
        required=True,
        help="Path to JSON file containing sample queries",
    )
    parser.add_argument(
        "--strong-model-pct",
        type=float,
        default=0.5,
        help="Target percentage of queries to route to the strong model (default: 0.5)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="calibration_results.json",
        help="Output file to save calibration results (default: calibration_results.json)",
    )
    args = parser.parse_args()

    # Load sample queries
    sample_queries = load_sample_queries(args.sample_queries)

    # Use the existing AdvancedRouter instance
    router = advanced_router

    # Calibrate threshold
    threshold = calibrate_threshold(router, sample_queries, args.strong_model_pct)

    print(
        f"Optimal threshold for {args.strong_model_pct*100}% strong model calls: {threshold}"
    )

    # Save results
    results = {
        "strong_model_percentage": args.strong_model_pct,
        "optimal_threshold": threshold,
    }
    with open(args.output, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Calibration results saved to {args.output}")


if __name__ == "__main__":
    main()

calibration_results.json

{
  "strong_model_percentage": 0.5,
  "optimal_threshold": 0.63
}

