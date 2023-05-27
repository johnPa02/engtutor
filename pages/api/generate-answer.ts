import type { NextApiRequest, NextApiResponse } from 'next';
import {Configuration,OpenAIApi} from 'openai'


const configuration = new Configuration({
    apiKey:process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration);

export default async function handler(
    req: NextApiRequest,
    res:NextApiResponse
){
    const {messages} = req.body
    if (!messages) {
        return res.status(400).json({ error: 'No question in the request' });
    }
    try{
        const airesult = await openai.createChatCompletion({
            model:"gpt-3.5-turbo",
            messages: [{"role":"system","content":"You are an English tutor who helps me \
            practice IELTS speaking by chatting with me, choosing any topic from the following topics: \
            a trip, a building, the countryside, a certain person. If I have any grammar or spelling \
            mistakes or the answer is not good please let me know and correct it to be more reasonable \
            and better. For example when I give the mistake sentence: \
            'That is a big market with many hàng hóa with full of type, since this is an incorrect \
            sentence, please answer: 'Maybe you forgot to add the word 'a' before 'wide variety' \
            to make the sentence more correct. Adjust the sentence to: 'That is a large market with \
            a wide variety of goods for sale.'"},...messages]
        })
        const response = airesult.data.choices[0].message || 'Sorry, there was a problem'
        res.status(200).json(response)
        console.log(response)
    }catch (error: any) {
        console.log('error', error);
        res.status(500).json({ error: error.message || 'Something went wrong' });
      }
}
