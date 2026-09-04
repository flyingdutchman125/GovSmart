# pyrefly: ignore [missing-import]
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    nik_or_nip: str = Field(..., min_length=16, max_length=20, description="NIK untuk warga (16 digit), NIP untuk pegawai")
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class AdminDinasCreate(BaseModel):
    nip: str = Field(..., min_length=16, max_length=20, description="NIP Pegawai")
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

