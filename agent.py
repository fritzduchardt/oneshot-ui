import json
import logging
import time
from typing import Any

import anthropic


TOOL_USE_STOP_REASON = "tool_use"
TOKENS_LIMIT_STOP_REASON = "max_tokens"
END_TURN_STOP_REASON = "end_turn"
PAUSE_TURN_STOP_REASON = "pause_turn"


def call_ai(
    client: anthropic.Anthropic,
    model: str,
    system_prompt: str,
    messages: list[dict],
    tools: list[dict],
    max_tokens: int = 16000,
) -> anthropic.types.Message:
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        tools=tools,
        messages=messages,
    )
    return response


def call_ai_only_tools(
    client: anthropic.Anthropic,
    model: str,
    system_prompt: str,
    messages: list[dict],
    tools: list[dict],
    max_tokens: int = 16000,
) -> anthropic.types.Message:
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        tools=tools,
        tool_choice={"type": "any"},
        messages=messages,
    )
    return response


def process_tool_calls(
    response: anthropic.types.Message,
) -> list[dict]:
    tool_uses = [block for block in response.content if block.type == "tool_use"]
    tool_results = []
    for tool_use in tool_uses:
        tool_name = tool_use.name
        tool_input = tool_use.input
        logging.info(f"Tool used: {tool_name}")
        logging.info(f"Tool input: {tool_input}")
        result = execute_tool(tool_name, tool_input)
        logging.info(f"Tool result: {result}")
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": tool_use.id,
            "content": result,
        })
    return tool_results


def execute_tool(tool_name: str, tool_input: dict) -> str:
    from tools import TOOLS_MAP
    if tool_name in TOOLS_MAP:
        return TOOLS_MAP[tool_name](tool_input)
    else:
        return f"Tool {tool_name} not found"


def run_agent(
    client: anthropic.Anthropic,
    model: str,
    system_prompt: str,
    messages: list[dict],
    tools: list[dict],
    max_tokens: int = 16000,
) -> str:
    while True:
        response = call_ai(
            client,
            model,
            system_prompt,
            messages,
            tools,
            max_tokens,
        )
        logging.info(f"Stop reason: {response.stop_reason}")

        if response.stop_reason == TOKENS_LIMIT_STOP_REASON:
            logging.warning("Token limit reached")
            break

        if response.stop_reason == PAUSE_TURN_STOP_REASON:
            logging.warning("Pause turn reached")
            break

        if response.stop_reason == END_TURN_STOP_REASON:
            final_response = next(
                (block.text for block in response.content if hasattr(block, "text")),
                None,
            )
            logging.info(f"Final response: {final_response}")
            return final_response

        if response.stop_reason == TOOL_USE_STOP_REASON:
            tool_results = process_tool_calls(response)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

    return None