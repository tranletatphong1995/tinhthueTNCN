document.addEventListener('DOMContentLoaded', function() {
    // --- UTILITY FUNCTIONS ---
    const formatCurrency = (num) => new Intl.NumberFormat('vi-VN').format(num);
    const parseCurrency = (str) => {
        if (typeof str !== 'string' || !str) return 0;
        return Number(str.replace(/[,.]/g, ''));
    };

    const applyAutoFormatting = (inputId) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', (e) => {
                let value = e.target.value;
                let numValue = parseCurrency(value);
                if (isNaN(numValue)) {
                    e.target.value = '';
                }
            });
            input.addEventListener('blur', (e) => {
                const value = parseCurrency(e.target.value);
                if (!isNaN(value) && value.toString().length > 0) {
                    e.target.value = formatCurrency(value);
                }
            });
            input.addEventListener('focus', (e) => {
                const value = parseCurrency(e.target.value);
                if (!isNaN(value) && value !== 0) {
                    e.target.value = value;
                } else {
                    e.target.value = '';
                }
            });
        }
    };

    const numericInputs = ['total-income', 'exempt-income', 'insurance', 'business-revenue', 'securities-value', 'real-estate-price', 'capital-income', 'copyright-income', 'winnings-income', 'inheritance-value', 'non-resident-income'];
    numericInputs.forEach(applyAutoFormatting);

    // --- TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
    
    // --- DEDUCTION TOGGLE LOGIC ---
    const setupDeductionToggle = (checkboxId, containerId) => {
        const checkbox = document.getElementById(checkboxId);
        const container = document.getElementById(containerId);
        if (checkbox && container) {
            checkbox.addEventListener('change', () => {
                container.classList.toggle('hidden', !checkbox.checked);
            });
        }
    };

    setupDeductionToggle('has-dependents', 'dependents-input-container');
    setupDeductionToggle('has-insurance', 'insurance-input-container');

    // --- CALCULATION LOGIC ---

    // 1. Salary Tax
    document.getElementById('salary-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const totalIncome = parseCurrency(document.getElementById('total-income').value);
        const exemptIncome = parseCurrency(document.getElementById('exempt-income').value);
        const resultDiv = document.getElementById('salary-result');
        
        const hasDependents = document.getElementById('has-dependents').checked;
        const dependentsCount = hasDependents ? parseInt(document.getElementById('dependents').value) || 0 : 0;
        
        const hasInsurance = document.getElementById('has-insurance').checked;
        const insuranceAmount = hasInsurance ? parseCurrency(document.getElementById('insurance').value) : 0;

        if (totalIncome <= 0) {
            resultDiv.innerHTML = `<p class="font-semibold text-red-600">Vui lòng nhập tổng thu nhập hợp lệ.</p>`;
            resultDiv.style.display = 'block';
            return;
        }

        const selfDeduction = 11000000;
        const dependentDeductionTotal = dependentsCount * 4400000;
        const taxableIncomeBeforeDeductions = totalIncome - exemptIncome;
        const totalDeductions = selfDeduction + dependentDeductionTotal + insuranceAmount;
        const finalTaxableIncome = Math.max(0, taxableIncomeBeforeDeductions - totalDeductions);
        
        let tax = 0;
        let explanation = '';

        if (finalTaxableIncome > 0) {
            let incomeLeft = finalTaxableIncome;
            let detailHtml = '<ul class="list-disc list-inside space-y-1 mt-2 text-sm">';
            
            if (incomeLeft > 80000000) { const taxPart = (incomeLeft - 80000000) * 0.35; tax += taxPart; detailHtml += `<li>Bậc 7: (${formatCurrency(incomeLeft)} - 80,000,000) × 35% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 80000000; }
            if (incomeLeft > 52000000) { const taxPart = (incomeLeft - 52000000) * 0.30; tax += taxPart; detailHtml += `<li>Bậc 6: (${formatCurrency(incomeLeft)} - 52,000,000) × 30% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 52000000; }
            if (incomeLeft > 32000000) { const taxPart = (incomeLeft - 32000000) * 0.25; tax += taxPart; detailHtml += `<li>Bậc 5: (${formatCurrency(incomeLeft)} - 32,000,000) × 25% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 32000000; }
            if (incomeLeft > 18000000) { const taxPart = (incomeLeft - 18000000) * 0.20; tax += taxPart; detailHtml += `<li>Bậc 4: (${formatCurrency(incomeLeft)} - 18,000,000) × 20% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 18000000; }
            if (incomeLeft > 10000000) { const taxPart = (incomeLeft - 10000000) * 0.15; tax += taxPart; detailHtml += `<li>Bậc 3: (${formatCurrency(incomeLeft)} - 10,000,000) × 15% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 10000000; }
            if (incomeLeft > 5000000) { const taxPart = (incomeLeft - 5000000) * 0.10; tax += taxPart; detailHtml += `<li>Bậc 2: (${formatCurrency(incomeLeft)} - 5,000,000) × 10% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; incomeLeft = 5000000; }
            if (incomeLeft > 0) { const taxPart = incomeLeft * 0.05; tax += taxPart; detailHtml += `<li>Bậc 1: ${formatCurrency(incomeLeft)} × 5% = <b>${formatCurrency(taxPart.toFixed(0))}</b></li>`; }
            detailHtml += '</ul>';
            explanation = detailHtml;
        }
        
        const createRow = (label, value, labelClass = 'text-gray-600', valueClass = 'font-medium text-right') => {
            return `<div class="flex justify-between items-baseline py-1">
                        <span class="${labelClass}">${label}</span>
                        <span class="${valueClass}">${value}</span>
                    </div>`;
        };

        let deductionsHtml = '<div class="mt-3 space-y-1 text-sm">';
        deductionsHtml += createRow('Thu nhập chịu thuế:', formatCurrency(taxableIncomeBeforeDeductions));
        deductionsHtml += '<div class="border-t my-2"></div>';
        deductionsHtml += '<p class="font-semibold text-gray-800">Các khoản giảm trừ:</p>';
        deductionsHtml += '<div class="pl-2 space-y-1">';
        deductionsHtml += createRow('&bull; Giảm trừ bản thân:', formatCurrency(selfDeduction));
        if (dependentsCount > 0) {
            deductionsHtml += createRow(`&bull; Người phụ thuộc (${dependentsCount} người):`, formatCurrency(dependentDeductionTotal));
        }
        if (insuranceAmount > 0) {
            deductionsHtml += createRow('&bull; Bảo hiểm bắt buộc:', formatCurrency(insuranceAmount));
        }
        deductionsHtml += '</div>';
        deductionsHtml += '<div class="border-t my-2"></div>';
        deductionsHtml += createRow('Tổng giảm trừ:', formatCurrency(totalDeductions), 'text-gray-600 font-semibold', 'font-semibold text-right');
        deductionsHtml += createRow('Thu nhập tính thuế:', formatCurrency(finalTaxableIncome), 'text-gray-800 font-bold text-base', 'font-bold text-base text-right');
        deductionsHtml += `</div>`;
        
        resultDiv.innerHTML = `
            <h4 class="font-bold text-lg">Kết quả tính thuế (tháng):</h4>
            ${deductionsHtml}
            ${finalTaxableIncome > 0 ? `<div class="border-t my-3"></div><p class="font-semibold">Chi tiết các bậc thuế:</p>${explanation}` : ''}
            <div class="mt-4 p-3 bg-blue-100 rounded-md text-center">
                <p class="text-sm text-blue-800">TỔNG SỐ THUẾ TNCN PHẢI NỘP</p>
                <p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p>
            </div>
            ${finalTaxableIncome <= 0 ? '<p class="mt-3 text-green-700 font-semibold">Thu nhập tính thuế của bạn không dương, bạn không phải nộp thuế TNCN.</p>' : ''}
        `;
        resultDiv.style.display = 'block';
    });
    
    // Other form submissions
    document.getElementById('business-form').addEventListener('submit', function(e) { e.preventDefault(); const revenue = parseCurrency(document.getElementById('business-revenue').value), rate = parseFloat(document.getElementById('business-type').value), resultDiv = document.getElementById('business-result'), tax = revenue * rate; resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4><p class="mt-2 text-sm">Thuế TNCN = ${formatCurrency(revenue)} × ${rate*100}%</p><div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('securities-form').addEventListener('submit', function(e) { e.preventDefault(); const value = parseCurrency(document.getElementById('securities-value').value), resultDiv = document.getElementById('securities-result'), tax = value * 0.001; resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4><p class="mt-2 text-sm">Thuế TNCN = ${formatCurrency(value)} × 0.1%</p><div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('real-estate-form').addEventListener('submit', function(e) { e.preventDefault(); const price = parseCurrency(document.getElementById('real-estate-price').value), isOnlyProperty = document.getElementById('only-property').checked, resultDiv = document.getElementById('real-estate-result'); let tax = 0, explanation = ''; if (isOnlyProperty) { tax = 0; explanation = '<p class="mt-3 text-green-700 font-semibold">Được miễn thuế do đây là nhà đất duy nhất.</p>'; } else { tax = price * 0.02; explanation = `<p class="mt-2 text-sm">Thuế TNCN = ${formatCurrency(price)} × 2%</p>`; } resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4>${explanation}<div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('capital-form').addEventListener('submit', function(e) { e.preventDefault(); const income = parseCurrency(document.getElementById('capital-income').value), resultDiv = document.getElementById('capital-result'), tax = income * 0.05; resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4><p class="mt-2 text-sm">Thuế TNCN = ${formatCurrency(income)} × 5%</p><div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('copyright-form').addEventListener('submit', function(e){ e.preventDefault(); const income = parseCurrency(document.getElementById('copyright-income').value), tax = income > 10000000 ? (income - 10000000) * 0.05 : 0, resultDiv = document.getElementById('copyright-result'); let explanation = tax > 0 ? `<p class="mt-2 text-sm">Thuế TNCN = (${formatCurrency(income)} - 10,000,000) × 5%</p>` : '<p class="mt-3 text-green-700 font-semibold">Không phải nộp thuế do phần thu nhập vượt trên 10 triệu đồng không có.</p>'; resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4>${explanation}<div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('winnings-form').addEventListener('submit', function(e){ e.preventDefault(); const income = parseCurrency(document.getElementById('winnings-income').value), resultDiv = document.getElementById('winnings-result'); let tax = 0, explanation = ''; if (income > 10000000) { tax = (income - 10000000) * 0.10; explanation = `<p class="mt-2 text-sm">Thuế TNCN = (${formatCurrency(income)} - 10,000,000) × 10%</p>`; } else { explanation = '<p class="mt-3 text-green-700 font-semibold">Không phải nộp thuế do giá trị giải thưởng không vượt quá 10 triệu đồng.</p>'; } resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4>${explanation}<div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('inheritance-form').addEventListener('submit', function(e){ e.preventDefault(); const value = parseCurrency(document.getElementById('inheritance-value').value), resultDiv = document.getElementById('inheritance-result'); let tax = 0, explanation = ''; if (value > 10000000) { tax = (value - 10000000) * 0.10; explanation = `<p class="mt-2 text-sm">Thuế TNCN = (${formatCurrency(value)} - 10,000,000) × 10%</p>`; } else { explanation = '<p class="mt-3 text-green-700 font-semibold">Không phải nộp thuế do giá trị tài sản không vượt quá 10 triệu đồng.</p>'; } resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4>${explanation}<div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
    document.getElementById('non-resident-form').addEventListener('submit', function(e){ e.preventDefault(); const income = parseCurrency(document.getElementById('non-resident-income').value), tax = income * 0.20, resultDiv = document.getElementById('non-resident-result'); resultDiv.innerHTML = `<h4 class="font-bold text-lg">Kết quả tính thuế:</h4><p class="mt-2 text-sm">Thuế TNCN = ${formatCurrency(income)} × 20%</p><div class="mt-4 p-3 bg-blue-100 rounded-md text-center"><p class="text-sm text-blue-800">SỐ THUẾ TNCN PHẢI NỘP</p><p class="text-2xl font-bold text-blue-800">${formatCurrency(tax.toFixed(0))} VND</p></div>`; resultDiv.style.display = 'block'; });
});