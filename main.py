from flask import Flask, jsonify, render_template, url_for, redirect, session, request
from flask_dance.contrib.google import make_google_blueprint, google
from pathlib import Path
from pdf_processor import PDFProcessor
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from fpdf import FPDF
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.template_folder = 'templates'

# Set a strong secret key
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# Google OAuth config
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'  # Add this line

# Get the deployment URL from environment variable or use localhost for development
DEPLOYMENT_URL = os.getenv('RENDER_EXTERNAL_URL', 'http://127.0.0.1:5000')

google_bp = make_google_blueprint(
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    scope=["openid", 
           "https://www.googleapis.com/auth/userinfo.email",
           "https://www.googleapis.com/auth/userinfo.profile"],
    redirect_url=f"{DEPLOYMENT_URL}/login/google/authorized",
    offline=True
)
app.register_blueprint(google_bp, url_prefix="/login")

pdf_processor = PDFProcessor()

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    uploaded_pdfs = session.get('uploaded_pdfs', [])
    generated_papers = session.get('generated_papers', [])
    return render_template('index.html', 
                         is_authenticated=google.authorized,
                         email=session.get('email'),
                         picture=session.get('picture'),
                         uploaded_pdfs=uploaded_pdfs,
                         generated_papers=generated_papers)

@app.route('/paper')
def paper():
    try:
        filename = request.args.get('file')
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Add debug prints
        print(f"Attempting to process: {file_path}")
        print(f"File exists: {os.path.exists(file_path)}")
        
        questions = pdf_processor.extract_questions(file_path)
        print(f"Found {len(questions)} questions")
        
        # Log extracted questions for debugging
        print(f"\nProcessing PDF: {filename}")
        print("Extracted Questions:")
        for q in questions:
            print(f"\nID: {q['id']}")
            print(f"Question: {q['text']}")
            print(f"Answer: {q['answer']}")
            print("-" * 50)

        return render_template('paper1.html', 
                             questions=questions,
                             filename=filename,
                             is_authenticated=google.authorized)

    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return render_template('paper1.html', 
                             error=str(e),
                             is_authenticated=google.authorized)

@app.route('/get-questions')
def get_questions():
    try:
        current_dir = Path(__file__).parent
        pdf_files = list(current_dir.glob('*.pdf'))
        
        print(f"Looking for PDFs in: {current_dir}")
        print(f"Found PDFs: {pdf_files}")
        
        if not pdf_files:
            return jsonify({'error': 'No PDF files found'})
        
        pdf_path = pdf_files[0]
        print(f"Processing PDF: {pdf_path}")
        
        questions = pdf_processor.extract_questions(pdf_path)
        
        # Log extracted questions
        print("\nExtracted Questions:")
        for q in questions:
            print(f"\nID: {q['id']}")
            print(f"Question: {q['text']}")
            print(f"Answer: {q['answer']}")
            print("-" * 50)
        
        return jsonify({
            'filename': pdf_path.name,
            'questions': questions
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)})

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Get existing PDFs from session
        uploaded_pdfs = session.get('uploaded_pdfs', [])
        
        # Add new PDF to list
        new_pdf = {
            'filename': filename,
            'path': file_path
        }
        uploaded_pdfs.append(new_pdf)
        
        # Update session
        session['uploaded_pdfs'] = uploaded_pdfs
        session.modified = True  # Force session update
        
        return jsonify({'success': True, 'filename': filename})
    
    return jsonify({'error': 'Invalid file type'})

@app.route('/login')
def login():
    if google.authorized:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Callback route for Google OAuth
@app.route('/login/google/authorized')
def google_authorized():
    if not google.authorized:
        return redirect(url_for("google.login"))
    
    try:
        resp = google.get("/oauth2/v2/userinfo")
        if resp.ok:
            user_info = resp.json()
            session['email'] = user_info["email"]
            session['picture'] = user_info.get("picture")  # Add profile picture URL
            return redirect(url_for('index'))  # Changed this line to redirect to index
    except Exception as e:
        print(f"OAuth Error: {str(e)}")
        session.clear()
        return redirect(url_for('login'))
    
    return "Failed to get Google user info", 400

@app.route('/generate-paper', methods=['POST'])
def generate_paper():
    try:
        data = request.get_json()
        selected_questions = data.get('selectedQuestions', [])
        marks_total = sum(q['marks'] for q in selected_questions)
        
        # Save the generated paper
        filename = save_generated_paper(selected_questions, marks_total)
        
        if filename:
            # Get existing generated papers from session
            generated_papers = session.get('generated_papers', [])
            
            # Add new paper to list
            new_paper = {
                'filename': filename,
                'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'marks': marks_total,
                'num_questions': len(selected_questions)
            }
            generated_papers.append(new_paper)
            session['generated_papers'] = generated_papers
            
            return jsonify({
                'success': True,
                'filename': filename,
                'message': 'Paper generated successfully!'
            })
            
        return jsonify({
            'success': False,
            'message': 'Failed to generate paper'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

def save_generated_paper(questions, marks_total):
    try:
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        
        # Add header
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'Generated Question Paper', 0, 1, 'C')
        pdf.cell(0, 10, f'Total Marks: {marks_total}', 0, 1, 'C')
        pdf.ln(10)
        
        # Add questions
        pdf.set_font('Arial', '', 12)
        for q in questions:
            pdf.multi_cell(0, 10, f"{q['id']}. {q['text']}")
            pdf.cell(0, 10, f"[{q['marks']} marks]", 0, 1, 'R')
            pdf.ln(5)
            
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'generated_paper_{timestamp}.pdf'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save PDF
        pdf.output(filepath)
        
        return filename
    except Exception as e:
        print(f"Error saving generated paper: {str(e)}")
        return None

if __name__ == "__main__":
    # Development server
    app.run(debug=True)
else:
    # Production Gunicorn server
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True