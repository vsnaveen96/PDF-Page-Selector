const { PDFDocument } = PDFLib;

let pdfDoc = null;
let totalPages = 0;

document.getElementById('pdfFile').addEventListener('change', handleFileSelect);
document.getElementById('addRange').addEventListener('click', addRangeInput);
document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await PDFDocument.load(arrayBuffer);
        totalPages = pdfDoc.getPageCount();
        
        document.getElementById('pageInfo').textContent = `Total pages: ${totalPages}`;
        document.getElementById('rangesList').innerHTML = '';
        document.getElementById('addRange').disabled = false;
        document.getElementById('downloadBtn').disabled = false;
        
        addRangeInput();
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF file. Please try again.');
    }
}

function addRangeInput() {
    const rangesList = document.getElementById('rangesList');
    const rangeItem = document.createElement('div');
    rangeItem.className = 'range-item';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'range-input';
    input.placeholder = 'Pages (e.g., 1-3 or 5)';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'name-input';
    nameInput.placeholder = 'PDF Name';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-range';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => rangesList.removeChild(rangeItem);
    
    rangeItem.appendChild(input);
    rangeItem.appendChild(nameInput);
    rangeItem.appendChild(removeBtn);
    rangesList.appendChild(rangeItem);
}

function parsePageRanges(rangeStr) {
    const pages = new Set();
    const ranges = rangeStr.split(',').map(r => r.trim());
    
    for (const range of ranges) {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n));
            if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > totalPages) {
                throw new Error(`Invalid range: ${range}`);
            }
            for (let i = start; i <= end; i++) {
                pages.add(i - 1);
            }
        } else {
            const page = parseInt(range);
            if (isNaN(page) || page < 1 || page > totalPages) {
                throw new Error(`Invalid page number: ${range}`);
            }
            pages.add(page - 1);
        }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
}

async function downloadPDF() {
    try {
        const rangeItems = Array.from(document.getElementsByClassName('range-item'));
        const ranges = rangeItems.map(item => ({
            range: item.querySelector('.range-input').value.trim(),
            name: item.querySelector('.name-input').value.trim() || 'unnamed'
        })).filter(item => item.range !== '');

        if (ranges.length === 0) {
            alert('Please enter at least one page range');
            return;
        }

        for (const {range, name} of ranges) {
            const pages = parsePageRanges(range);
            if (pages.length === 0) continue;

            const newPdfDoc = await PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pages);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            a.click();
            
            URL.revokeObjectURL(url);
        }

    } catch (error) {
        console.error('Error processing PDF:', error);
        alert(error.message || 'Error processing PDF. Please check your input and try again.');
    }
}