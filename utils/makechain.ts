import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { VectorDBQAChain } from 'langchain/chains';

export const makeChain = (vectorstore: PineconeStore) => {
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  const chain = VectorDBQAChain.fromLLM(model, vectorstore,{
    returnSourceDocuments: true,
    k: 3});
  return chain
};

