# Prompt

**User:** The AI assistant's behaviour has become erratic and inconsistent. It is outputting raw JSON structures — including bare arrays and unformatted tool objects — directly into the chat interface rather than executing them as tool invocations. Multi-tool requests fail silently, individual tool invocations produce disconnected outputs, and the conversational flow is completely disrupted. The tool parsing layer and the mock language model both require substantial revision to handle complex, multi-step interactions reliably.

---

## Response

**OpenCode:** Undertook a comprehensive overhaul of the agent's parsing and execution pipeline comprising four coordinated modifications:

**1. `_parse_tool_call` → `_parse_tool_calls`** — Replaced the single-dictionary parser with a function that accepts three distinct input shapes: a lone JSON object (`{...}`), a JSON array (`[{...}, {...}]`), or the raw response string. It first attempts `json.loads()` on the full response and any fenced code blocks, then falls back to splitting on newlines and parsing each line independently. Returns a `list[dict]` in all cases, defaulting to an empty list when no tool calls are detected.

**2. `run_agent` execution loop** — Transitioned from single-call dispatch to an iterative loop that processes each tool call sequentially, accumulating results and `ToolCall` records. Errors in individual tool executions are captured and reported per-invocation rather than aborting the entire sequence.

**3. `_strip_tool_block`** — Removed the `count=1` limit from the regex substitutions, causing all JSON tool blocks — whether single objects or arrays — to be stripped from the response. This ensures that when the response is pure JSON (no surrounding natural language), `textual` correctly evaluates as empty and the final response comprises solely the combined tool execution results.

**4. `_mock_llm`** — Replaced the single-keyword-matching architecture with a structured multi-detection pipeline. Added `_extract_names()` utility that isolates category names from bulk-creation phrases using colon-delimited splitting, stop-word filtering, and deduplication. Added `re.findall()`-based entry extraction for patterns like `expense 5000 for rent`. The function accumulates tool calls into a list and serialises the list as a JSON array when multiple calls are detected, or as a single object otherwise.
