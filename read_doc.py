import docx
import sys

doc = docx.Document(r'e:\AI\project_earn_money\FILE_CHUA_NEN\tomato_plant_diseases\YeuCau\NguyenHuuKhanhTung_223630722_Decuong DATN-Cử nhân_V2.docx')
text = '\n'.join([p.text for p in doc.paragraphs])
with open(r'e:\AI\project_earn_money\FILE_CHUA_NEN\tomato_plant_diseases\req_output.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print("DONE")
