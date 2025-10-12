"""
Barcode API Routes
Proxy endpoints for barcode product lookup services
"""
from fastapi import APIRouter, HTTPException
import httpx
from typing import Optional

router = APIRouter()


@router.get("/barcode/upc/{barcode}")
async def lookup_upc(barcode: str):
    """
    Proxy endpoint for UPC Database API lookup
    Bypasses CORS restrictions by making request from backend
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.upcitemdb.com/prod/trial/lookup",
                params={"upc": barcode},
                headers={
                    "Content-Type": "application/json",
                },
                timeout=10.0
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return {
                    "code": "NOT_FOUND",
                    "total": 0,
                    "items": []
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"UPC Database API error: {response.text}"
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="UPC Database API request timed out"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to UPC Database API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/barcode/openfoodfacts/{barcode}")
async def lookup_openfoodfacts(barcode: str):
    """
    Proxy endpoint for Open Food Facts API lookup (optional, for consistency)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json",
                headers={
                    "User-Agent": "ShelfMates - Food Inventory App - Version 1.0",
                },
                timeout=10.0
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return {
                    "status": 0,
                    "status_verbose": "product not found"
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Open Food Facts API error: {response.text}"
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Open Food Facts API request timed out"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to Open Food Facts API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
