from zhipuai import ZhipuAI

client = ZhipuAI(api_key="0fc9188d1ace1150638a2da89b43783b.b5fbixiaIsbVJUD3")


def invoke_embedding(query):
    response = client.embeddings.create(
        model="embedding-2",  # 填写需要调用的模型名称
        input=query,
    )
    return response.data[0].embedding


def invoke_prompt(prompt):
    response = client.chat.completions.create(
        model="glm-4",
        messages=[
            {"role": "user", "content": prompt},
        ],
        top_p=0.7,
        temperature=0.9
    )
    return str(response.choices[0].message.content)
