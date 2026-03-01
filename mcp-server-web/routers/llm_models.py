from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json

router = APIRouter()

LLM_MODELS = {}

try:
    with open("assets/llm_models.json", "r") as f:
        LLM_MODELS = json.load(f)
except Exception as e:
    print(f"Error loading default LLM models: {str(e)}")
    LLM_MODELS = {}


@router.get("/")
async def get_llm_models() -> Dict[str, Any]:
    """
    Route to retrieve available LLM models and their configurations.
    Returns a dictionary of model names mapped to their configurations.
    """
    try:
        return LLM_MODELS
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving LLM models: {str(e)}")