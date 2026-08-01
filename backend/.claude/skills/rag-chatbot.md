# RAG Chatbot

Build, debug, and enhance Retrieval-Augmented Generation (RAG) chatbot systems.

## When to Use

- Building a new RAG chatbot from scratch
- Adding RAG capabilities to existing chat systems
- Debugging retrieval or generation issues
- Optimizing embedding and retrieval performance
- Implementing document ingestion pipelines
- Setting up vector databases
- Enhancing answer quality with context

## Core Components

A RAG chatbot typically consists of:

1. **Document Processing Pipeline**
   - Document loaders (PDF, text, web, etc.)
   - Text chunking strategies
   - Metadata extraction

2. **Embedding & Vector Store**
   - Embedding model selection
   - Vector database (Chroma, FAISS, Pinecone, Qdrant, Weaviate)
   - Index creation and management

3. **Retrieval System**
   - Similarity search
   - Hybrid search (keyword + semantic)
   - Reranking mechanisms
   - Context window management

4. **Generation Pipeline**
   - LLM integration (OpenAI, Anthropic, local models)
   - Prompt engineering for RAG
   - Citation and source tracking
   - Streaming responses

5. **Chat Interface**
   - Conversation history management
   - User input handling
   - Response formatting

## Implementation Approach

### Step 1: Understand Requirements

First, clarify:
- What documents/data sources need to be indexed?
- What's the expected query volume and latency?
- Do you need real-time updates or batch indexing?
- What's the budget for infrastructure and API calls?
- Do you need citations/sources in responses?

### Step 2: Choose Technology Stack

**For Python:**
- **Framework**: LangChain, LlamaIndex, or custom implementation
- **Vector DB**: 
  - Local/small: FAISS, Chroma
  - Production: Pinecone, Qdrant, Weaviate
- **Embeddings**: OpenAI, Sentence-Transformers, Cohere
- **LLM**: OpenAI GPT, Anthropic Claude, local models via Ollama

**For JavaScript/TypeScript:**
- **Framework**: LangChain.js, custom implementation
- **Vector DB**: Pinecone, Supabase Vector, Qdrant
- **Embeddings**: OpenAI, Cohere, Transformers.js
- **LLM**: OpenAI, Anthropic, Vercel AI SDK

### Step 3: Document Processing

Implement chunking strategy:
- **Fixed-size chunking**: Simple, predictable (500-1000 tokens)
- **Semantic chunking**: Better context preservation
- **Recursive character splitting**: Respects document structure
- Always include overlap (50-200 characters) between chunks

### Step 4: Embedding & Indexing

```python
# Example pattern for Python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load and chunk documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
chunks = text_splitter.split_documents(documents)

# Create embeddings and store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

### Step 5: Retrieval Implementation

Key considerations:
- **k value**: Number of chunks to retrieve (typically 3-5)
- **Similarity threshold**: Filter low-relevance results
- **Reranking**: Use cross-encoder models for better results
- **Hybrid search**: Combine keyword and semantic search

### Step 6: Prompt Engineering for RAG

Standard RAG prompt pattern:
```
You are a helpful assistant. Answer the user's question based on the provided context.

Context:
{retrieved_context}

Question: {user_question}

Instructions:
- Only use information from the provided context
- If the context doesn't contain relevant information, say so
- Cite sources when possible
- Be concise and accurate

Answer:
```

### Step 7: Build Chat Loop

Handle conversation history:
- Store recent messages (last 5-10 exchanges)
- Include relevant history in retrieval query
- Manage token limits carefully

## Common Patterns

### Pattern 1: Basic RAG Chain

```python
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

qa_chain = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

answer = qa_chain.run(user_question)
```

### Pattern 2: Conversational RAG

```python
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

conversation_chain = ConversationalRetrievalChain.from_llm(
    llm=OpenAI(),
    retriever=vectorstore.as_retriever(),
    memory=memory
)

result = conversation_chain({"question": user_question})
```

### Pattern 3: Custom RAG with Citations

```python
# Retrieve with metadata
docs = vectorstore.similarity_search_with_score(query, k=3)

# Format context with sources
context = "\n\n".join([
    f"[Source {i+1}] {doc.page_content}\n(from: {doc.metadata['source']})"
    for i, (doc, score) in enumerate(docs)
])

# Generate with LLM
prompt = f"""Context:\n{context}\n\nQuestion: {query}\n\nAnswer with citations:"""
answer = llm.generate(prompt)
```

## Best Practices

### Document Processing
- ✅ Use semantic chunking for better context preservation
- ✅ Include metadata (source, date, author) with chunks
- ✅ Add chunk overlap to prevent context loss
- ❌ Don't make chunks too small (<200 tokens) or too large (>1500 tokens)

### Retrieval
- ✅ Experiment with k values (3-5 is usually good)
- ✅ Use reranking for better precision
- ✅ Implement hybrid search when possible
- ✅ Log retrieval results for debugging
- ❌ Don't retrieve too many chunks (increases noise)

### Generation
- ✅ Use clear system prompts about context usage
- ✅ Instruct model to cite sources
- ✅ Handle cases where context is insufficient
- ✅ Stream responses for better UX
- ❌ Don't exceed context window limits

### Performance
- ✅ Cache embeddings
- ✅ Use batch processing for indexing
- ✅ Implement async operations where possible
- ✅ Monitor API usage and costs
- ❌ Don't re-embed same documents

## Debugging Checklist

When RAG isn't working well:

**Poor Retrieval:**
- [ ] Check if documents are properly indexed
- [ ] Verify embedding model matches at index and query time
- [ ] Test with simple exact-match queries
- [ ] Examine actual retrieved chunks (are they relevant?)
- [ ] Try different chunk sizes and overlap values

**Poor Generation:**
- [ ] Review the prompt template
- [ ] Check if retrieved context is being passed correctly
- [ ] Verify LLM is receiving within token limits
- [ ] Test LLM with manual context to isolate issue
- [ ] Check if system prompt conflicts with RAG pattern

**Slow Performance:**
- [ ] Profile embedding generation time
- [ ] Check vector search latency
- [ ] Monitor LLM API response times
- [ ] Consider caching frequent queries
- [ ] Optimize chunk retrieval count

## Testing Strategy

1. **Unit Tests**: Test each component (chunking, embedding, retrieval)
2. **Integration Tests**: Test full RAG pipeline
3. **Evaluation Metrics**:
   - Retrieval precision/recall
   - Answer relevance
   - Faithfulness to source
   - Citation accuracy
4. **Manual Review**: Sample random queries and review responses

## Common Frameworks

### LangChain
- Most popular, extensive ecosystem
- Good for rapid prototyping
- Can be heavy and abstracted

### LlamaIndex
- Optimized for RAG use cases
- Excellent indexing strategies
- Great for document-heavy applications

### Custom Implementation
- Maximum control and flexibility
- Lighter weight
- More work to implement
- Best when you have specific requirements

## Implementation Checklist

For each RAG chatbot project:

- [ ] Define document sources and formats
- [ ] Choose embedding model and vector database
- [ ] Implement document loading and chunking
- [ ] Set up vector index with proper configuration
- [ ] Build retrieval mechanism with appropriate k value
- [ ] Design RAG prompt template
- [ ] Implement generation pipeline
- [ ] Add conversation history management
- [ ] Build chat interface (CLI, web, API)
- [ ] Add error handling and fallbacks
- [ ] Implement logging and monitoring
- [ ] Test with sample queries
- [ ] Optimize based on evaluation metrics
- [ ] Deploy with proper infrastructure

## Output

When completing RAG chatbot work:
- Provide working code with clear comments
- Include setup instructions for dependencies
- Document configuration options
- Show example queries and responses
- Explain key design decisions
- List any known limitations or trade-offs
