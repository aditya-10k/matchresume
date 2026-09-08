import io
from pypdf import PdfReader


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Extracts text content from PDF file bytes using pypdf."""
    reader = PdfReader(io.BytesIO(file_bytes))
    extracted_text_pieces = []
    
    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            extracted_text_pieces.append(page_text)
            
    full_text = "\n\n".join(extracted_text_pieces).strip()
    return full_text
