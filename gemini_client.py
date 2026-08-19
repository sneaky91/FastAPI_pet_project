from google import genai

from config import config_obj


def get_answer_from_gemini(prompt: str):
    if not config_obj.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Set your Gemini API key in the environment."
        )

    client = genai.Client(api_key=config_obj.gemini_api_key)
    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=prompt,
    )
    return interaction.output_text
