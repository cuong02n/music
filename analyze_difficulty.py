import os
import re
from pathlib import Path
try:
    import PyPDF2
except ImportError:
    print("❌ Chưa cài PyPDF2. Hãy chạy: pip install PyPDF2")
    exit(1)

def analyze_pdf_difficulty(pdf_path):
    """
    Phân tích độ khó của sheet nhạc PDF
    
    Tiêu chí:
    - Easy (4-6 tháng): Ít nốt, nhịp đơn giản, ít hợp âm
    - Medium (6-18 tháng): Nhiều nốt hơn, có hợp âm, nhịp phức tạp
    - Hard (>1.5 năm): Rất nhiều nốt, hợp âm phức tạp, kỹ thuật cao
    """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            # Đọc text từ tất cả các trang
            full_text = ""
            for page in pdf_reader.pages:
                full_text += page.extract_text()
            
            # Phân tích các yếu tố
            score = 0
            reasons = []
            
            # 1. Số trang (sheet dài thường khó hơn)
            if num_pages == 1:
                score += 0
                reasons.append(f"1 trang (đơn giản)")
            elif num_pages == 2:
                score += 1
                reasons.append(f"2 trang (trung bình)")
            else:
                score += 2
                reasons.append(f"{num_pages} trang (phức tạp)")
            
            # 2. Kiểm tra ký hiệu phức tạp
            complex_symbols = [
                'triplet', 'sixteenth', '16th', 'thirty-second', '32nd',
                'crescendo', 'diminuendo', 'staccato', 'legato',
                'arpeggio', 'trill', 'mordent', 'turn'
            ]
            
            text_lower = full_text.lower()
            found_complex = [sym for sym in complex_symbols if sym in text_lower]
            if len(found_complex) > 3:
                score += 2
                reasons.append(f"Nhiều ký hiệu phức tạp ({len(found_complex)})")
            elif len(found_complex) > 0:
                score += 1
                reasons.append(f"Có ký hiệu phức tạp ({len(found_complex)})")
            
            # 3. Kiểm tra tempo
            fast_tempos = ['allegro', 'presto', 'vivace', 'veloce']
            if any(tempo in text_lower for tempo in fast_tempos):
                score += 1
                reasons.append("Tempo nhanh")
            
            # 4. Kiểm tra key signature phức tạp (nhiều dấu thăng/giáng)
            sharps_flats = text_lower.count('#') + text_lower.count('♯') + text_lower.count('♭') + text_lower.count('b')
            if sharps_flats > 20:
                score += 2
                reasons.append(f"Nhiều dấu thăng/giáng ({sharps_flats})")
            elif sharps_flats > 10:
                score += 1
                reasons.append(f"Có dấu thăng/giáng ({sharps_flats})")
            
            # 5. Độ dài text (nhiều text = nhiều nốt)
            text_length = len(full_text)
            if text_length > 5000:
                score += 2
                reasons.append(f"Rất nhiều nội dung ({text_length} ký tự)")
            elif text_length > 2000:
                score += 1
                reasons.append(f"Nhiều nội dung ({text_length} ký tự)")
            else:
                reasons.append(f"Ít nội dung ({text_length} ký tự)")
            
            # Xác định độ khó dựa trên điểm
            if score <= 2:
                difficulty = "Easy"
            elif score <= 5:
                difficulty = "Medium"
            else:
                difficulty = "Hard"
            
            return {
                'difficulty': difficulty,
                'score': score,
                'num_pages': num_pages,
                'reasons': reasons,
                'text_length': text_length
            }
            
    except Exception as e:
        return {
            'difficulty': 'Easy',  # Default
            'score': 0,
            'error': str(e),
            'reasons': [f'Lỗi khi đọc PDF: {str(e)}']
        }

def scan_and_analyze_all():
    """Quét tất cả file PDF và phân tích độ khó"""
    base_dir = Path(__file__).parent / 'piano'
    results = []
    
    print("🎹 Bắt đầu phân tích độ khó sheet nhạc...\n")
    
    for category in ['printed', 'not print']:
        category_path = base_dir / category
        if not category_path.exists():
            continue
        
        for song_dir in category_path.iterdir():
            if not song_dir.is_dir():
                continue
            
            # Tìm file PDF trong thư mục Easy/Piano
            pdf_files = list(song_dir.glob('Easy/Piano/*.pdf'))
            
            for pdf_file in pdf_files:
                print(f"📄 Đang phân tích: {song_dir.name}...")
                analysis = analyze_pdf_difficulty(pdf_file)
                
                result = {
                    'song_name': song_dir.name,
                    'category': category,
                    'pdf_path': str(pdf_file),
                    'current_difficulty': 'Easy',
                    'suggested_difficulty': analysis['difficulty'],
                    'score': analysis['score'],
                    'reasons': analysis['reasons']
                }
                results.append(result)
                
                # Hiển thị kết quả
                emoji = "🟢" if analysis['difficulty'] == "Easy" else "🟡" if analysis['difficulty'] == "Medium" else "🔴"
                print(f"   {emoji} Độ khó: {analysis['difficulty']} (điểm: {analysis['score']})")
                print(f"   Lý do: {', '.join(analysis['reasons'][:2])}")
                print()
    
    # Tổng kết
    print("\n" + "="*60)
    print("📊 TỔNG KẾT PHÂN TÍCH")
    print("="*60)
    
    easy_count = sum(1 for r in results if r['suggested_difficulty'] == 'Easy')
    medium_count = sum(1 for r in results if r['suggested_difficulty'] == 'Medium')
    hard_count = sum(1 for r in results if r['suggested_difficulty'] == 'Hard')
    
    print(f"🟢 Easy: {easy_count} bài")
    print(f"🟡 Medium: {medium_count} bài")
    print(f"🔴 Hard: {hard_count} bài")
    print(f"📁 Tổng: {len(results)} bài\n")
    
    # Hiển thị danh sách bài cần chuyển
    needs_change = [r for r in results if r['suggested_difficulty'] != 'Easy']
    if needs_change:
        print("📋 CÁC BÀI CẦN CHUYỂN ĐỘ KHÓ:")
        print("-" * 60)
        for r in needs_change:
            print(f"• {r['song_name']}")
            print(f"  Easy → {r['suggested_difficulty']} (điểm: {r['score']})")
            print(f"  Lý do: {', '.join(r['reasons'][:2])}")
            print()
    
    return results

def move_to_correct_difficulty(results, dry_run=True):
    """Di chuyển file vào thư mục độ khó đúng"""
    print("\n" + "="*60)
    if dry_run:
        print("🔍 CHẾ ĐỘ XEM TRƯỚC (không di chuyển file thật)")
    else:
        print("🚀 BẮT ĐẦU DI CHUYỂN FILE")
    print("="*60 + "\n")
    
    for result in results:
        if result['suggested_difficulty'] == result['current_difficulty']:
            continue
        
        pdf_path = Path(result['pdf_path'])
        song_dir = pdf_path.parent.parent.parent  # Lên 3 cấp: Piano -> Easy -> Song
        
        # Tạo đường dẫn mới
        new_difficulty_dir = song_dir / result['suggested_difficulty'] / 'Piano'
        new_pdf_path = new_difficulty_dir / pdf_path.name
        
        print(f"📦 {result['song_name']}")
        print(f"   Từ: {pdf_path.relative_to(song_dir)}")
        print(f"   Đến: {new_pdf_path.relative_to(song_dir)}")
        
        if not dry_run:
            # Tạo thư mục mới
            new_difficulty_dir.mkdir(parents=True, exist_ok=True)
            
            # Di chuyển file
            import shutil
            shutil.move(str(pdf_path), str(new_pdf_path))
            
            # Xóa thư mục cũ nếu trống
            old_dir = pdf_path.parent
            if old_dir.exists() and not any(old_dir.iterdir()):
                old_dir.rmdir()
                old_difficulty_dir = old_dir.parent
                if old_difficulty_dir.exists() and not any(old_difficulty_dir.iterdir()):
                    old_difficulty_dir.rmdir()
            
            print("   ✅ Đã di chuyển")
        else:
            print("   👁️  Sẽ di chuyển (dry run)")
        print()

if __name__ == "__main__":
    print("🎹 PHÂN TÍCH ĐỘ KHÓ SHEET NHẠC PIANO")
    print("="*60 + "\n")
    
    # Phân tích tất cả file
    results = scan_and_analyze_all()
    
    # Hỏi người dùng có muốn di chuyển không
    print("\n" + "="*60)
    choice = input("\n❓ Bạn có muốn di chuyển file vào thư mục đúng độ khó không?\n   1. Xem trước (dry run)\n   2. Di chuyển thật\n   3. Không\n\nChọn (1/2/3): ")
    
    if choice == "1":
        move_to_correct_difficulty(results, dry_run=True)
    elif choice == "2":
        move_to_correct_difficulty(results, dry_run=False)
        print("\n✅ Hoàn thành! Hãy chạy 'node generate_html.js' để cập nhật website.")
    else:
        print("\n👋 Đã hủy. Không có file nào được di chuyển.")
