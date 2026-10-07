"""Importa el PDF del usuario. No modifica el original. Requiere pypdf.

Uso: python scripts/import-bank.py RUTA_PDF
Escribe un banco JSON nuevo en tmp/importado; revisarlo antes de reemplazar data.
"""
from pathlib import Path
from collections import Counter
import re, json, sys
from pypdf import PdfReader
from distractors import generate

ROOT = Path(__file__).resolve().parents[1]
AREAS = [
    (1, 589, "historia-bolivia", "Historia de Bolivia"),
    (590, 836, "historia-contemporanea", "Historia Universal Contemporánea"),
    (837, 956, "historia-moderna", "Historia Moderna"),
    (957, 1283, "constitucion", "Constitución Política del Estado"),
    (1284, 1483, "regimen-universitario", "Régimen Universitario"),
    (1484, 1728, "filosofia", "Filosofía"),
    (1729, 1805, "etica", "Ética"),
    (1806, 2018, "derecho", "Nociones de Derecho"),
]
def clean(s):
    return re.sub(r"\s+", " ", s).strip()

def extract(pdf):
    lines = []
    for page_index, page in enumerate(PdfReader(pdf).pages):
        for line in (page.extract_text() or "").splitlines():
            line = line.strip()
            if not line or line.startswith(("UNIVERSIDAD MAYOR", "Guía Oficial de Preguntas", "Con CEAN")): continue
            if "PREGUNTAS Y RESPUESTAS" in line or line == "5. CIERRE INSTITUCIONAL":
                lines.append((page_index + 1, "__BOUNDARY__")); continue
            lines.append((page_index + 1, line))
    records, current, mode = [], None, None
    for page, line in lines:
        match = re.match(r"^Pregunta\s+([\d ]+)\s*:\s*(.*)", line)
        if match:
            if current: records.append(current)
            number = int(match[1].replace(" ", ""))
            area = next((a for a in AREAS if a[0] <= number <= a[1]), None)
            if not area: raise ValueError(f"Número desconocido: {number}")
            current = dict(id=f"CPU-{number:04}", number=number, page=page, slug=area[2], area=area[3], question=match[2], answer="")
            mode = "question"
        elif line == "__BOUNDARY__":
            if current: records.append(current)
            current, mode = None, None
        elif current:
            match = re.match(r"^Respuesta\s*:\s*(.*)", line)
            if match: mode = "answer"; current[mode] = match[1]
            else: current[mode] += " " + line
    if current: records.append(current)
    for row in records:
        row["question"], row["answer"] = clean(row["question"]), clean(row["answer"])
        if not row["question"] or not row["answer"]: raise ValueError(f"Pregunta incompleta: {row['id']}")
    counts = Counter(row["number"] for row in records)
    if sorted(counts) != list(range(1, 2019)) or any(n != 1 for n in counts.values()):
        raise ValueError(f"Numeración incompleta o repetida: {len(records)} registros")
    return records

# Incisos elaborados específicamente para la primera página.
CURATED = {
    1: ["La práctica del nomadismo.", "La caza itinerante.", "La recolección estacional.", "El intercambio de metales."],
    2: ["El estrecho de Magallanes.", "El canal de Panamá.", "El estrecho de Gibraltar.", "El cabo de Hornos."],
    3: ["Más de 4.000 años.", "Aproximadamente 10.000 años.", "Menos de 2.000 años.", "Alrededor de 5.000 años."],
    4: ["Clovis.", "Folsom.", "Cultura Viscachani.", "Cultura Wankarani."],
    5: ["Cultura Tiwanaku.", "Cultura Wankarani.", "Cultura Chiripa.", "Cultura Inca."],
    6: ["Dos metros más alto.", "Diez metros más alto.", "Cinco metros más bajo.", "Veinte metros más alto."],
    7: ["Escritura alfabética.", "Arquitectura monumental.", "Cerámica vidriada.", "Metalurgia del bronce."],
    8: ["Formativo.", "Clásico.", "Colonial.", "Republicano."],
    9: ["Centros industriales.", "Puertos marítimos.", "Ciudades coloniales.", "Fortalezas republicanas."],
    10: ["La llanura amazónica.", "La costa del Pacífico.", "El Chaco.", "Los llanos orientales."],
    11: ["La astronomía.", "La lingüística.", "La cartografía.", "La demografía."],
    12: ["La termometría.", "La dendrología.", "La espectrografía solar.", "La medición de la presión atmosférica."],
}

def write_bank(records, destination):
    destination.mkdir(parents=True, exist_ok=True)
    total = len(records)
    manifest = dict(version=2, total=total, source="Banco de Preguntas CPU Derecho CEAN76212424.pdf", alternatives="100 borradores independientes por pregunta; dificultad objetivo alta, pendiente de revisión docente.", areas=[], questions=[])
    for start, end, slug, name in AREAS:
        group = [r for r in records if r["slug"] == slug]
        area_folder = destination / slug
        area_folder.mkdir(exist_ok=True)
        for row in group:
            wrong = generate(row, CURATED.get(row['number']))
            record = dict(version=2, id=row['id'], number=row['number'], page=row['page'], area=name, question=row['question'], correct=row['answer'], distractors=wrong, review='pending', difficulty='target-high', generation='linguistic-draft')
            filename = f"{slug}/{row['id']}.json"
            (destination / filename).write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            manifest['questions'].append(dict(id=row['id'], file=filename, area=name))
        manifest['areas'].append(dict(id=slug, name=name, count=len(group)))
    (destination / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"preguntas": total, "respuestas_vacias": 0, "ids_duplicados": 0, "incisos_por_pregunta": 5, "distractores_por_pregunta":100, "total_distractores":total * 100, "almacenamiento":"Un archivo JSON por pregunta, incisos independientes y sin catálogo compartido.", "revision_docente": "Borradores mediante mutaciones de respuesta y familias de conceptos. Requieren revisión de gramática, pertinencia, dificultad y exclusividad de la respuesta correcta.", "areas": manifest["areas"]}
    (destination / "informe-importacion.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=True, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 2: raise SystemExit("Uso: python scripts/import-bank.py RUTA_PDF")
    write_bank(extract(sys.argv[1]), ROOT / "tmp" / "importado")
