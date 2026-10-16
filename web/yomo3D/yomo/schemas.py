from pydantic import BaseModel, Field
from typing import Literal


class Signup(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=128)


class Login(BaseModel):
    email: str
    password: str


class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    sector: Literal["BNB", "RESTO"]
    description: str = Field(default="", max_length=1000)
