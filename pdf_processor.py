import fitz  # PyMuPDF
import re

class PDFProcessor:
    def __init__(self):
        # Math paper keywords
        self.math_keywords = [
            'solve', 'find', 'calculate', 'prove', 'evaluate', 
            'determine', 'show that', 'simplify', 'express',
            'given that', 'let', 'consider', 'if', 'define',
            'check', 'graph', 'plot', 'sketch', 'differentiate',
            'integrate', 'verify'
        ]

    def clean_text(self, text):
        # Remove extra whitespace and normalize line endings
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_type1_questions(self, text):
        # For PDFs like 2160202.pdf that have clearly numbered questions
        questions = []
        question_blocks = re.split(r'(?=\d+\s*[\.|)]?\s*[A-Z])', text)
        
        for block in question_blocks:
            if not block.strip():
                continue

            # Check if block starts with a number and contains any math keyword
            is_question = (
                re.match(r'^\d+\s*[\.|)]?\s*[A-Z]', block.strip()) and
                any(keyword.lower() in block.lower() for keyword in self.math_keywords)
            )

            if is_question:
                # Split block into question and answer parts
                parts = re.split(r'(?i)solution:|answer:', block, maxsplit=1)
                
                question_text = self.clean_text(parts[0])
                answer_text = self.clean_text(parts[1]) if len(parts) > 1 else ""

                questions.append({
                    'text': question_text,
                    'answer': answer_text
                })

        return questions

    def extract_type2_questions(self, text):
        # For PDFs like 123.pdf that have different formatting
        questions = []
        # Look for sections that start with numbers followed by text
        question_pattern = r'(\d+[\.|)]\s*.*?)(?=\d+[\.|)]|$)'
        matches = re.finditer(question_pattern, text, re.DOTALL)
        
        for match in matches:
            question_text = match.group(1)
            # Split into question and answer if possible
            parts = re.split(r'(?i)solution:|answer:', question_text, maxsplit=1)
            
            if parts:
                question = self.clean_text(parts[0])
                answer = self.clean_text(parts[1]) if len(parts) > 1 else ""
                
                # Only include if it looks like a math question
                if any(keyword.lower() in question.lower() for keyword in self.math_keywords):
                    questions.append({
                        'text': question,
                        'answer': answer
                    })

        return questions

    def extract_questions(self, pdf_path):
        try:
            doc = fitz.open(pdf_path)
            full_text = ""
            for page in doc:
                full_text += page.get_text() + "\n"

            # Try both extraction methods
            questions_type1 = self.extract_type1_questions(full_text)
            questions_type2 = self.extract_type2_questions(full_text)

            # Use whichever method found more questions
            questions = questions_type1 if len(questions_type1) >= len(questions_type2) else questions_type2

            # Add IDs and additional fields
            final_questions = []
            for i, q in enumerate(questions, 1):
                final_questions.append({
                    'id': i,
                    'text': q['text'],
                    'answer': q['answer'],
                    'selected': False,
                    'marks': 3  # Default marks
                })

            print(f"\nTotal questions found: {len(final_questions)}")
            
            # Debug output
            for q in final_questions:
                print(f"\nQuestion {q['id']}:")
                print(f"Text: {q['text']}")
                print(f"Answer: {q['answer']}")
                print("-" * 50)

            return final_questions

        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            return []