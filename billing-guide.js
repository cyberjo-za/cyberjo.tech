const minutesPerVu = {
    1: 120,
    2: 90,
    3: 60,
    4: 45
};

const form = document.getElementById('billing-form');
const resultBox = document.getElementById('calculator-result');
const tierSelect = document.getElementById('final-tier');
const finalTierDisplay = document.getElementById('final-tier-display');
const finalTierTags = document.getElementById('final-tier-tags');
const tierInfoButton = document.getElementById('tier-info-button');
const tierModal = document.getElementById('tier-modal');
const tierModalClose = document.getElementById('tier-modal-close');
const tierModalTitle = document.getElementById('tier-modal-title');
const tierModalContent = document.getElementById('tier-modal-content');
const validationMessage = document.getElementById('form-validation');

if (form && resultBox) {
    const minutesEl = resultBox.querySelector('[data-result="minutes"]');
    const vuEl = resultBox.querySelector('[data-result="vu"]');
    const hoursEl = resultBox.querySelector('[data-result="hours"]');
    const summaryText = document.getElementById('result-summary-text');
    const copyButton = resultBox.querySelector('[data-action="copy-result"]');

    function resetResult() {
        if (minutesEl) minutesEl.textContent = '--';
        if (vuEl) vuEl.textContent = '--';
        if (hoursEl) hoursEl.textContent = '--';
        if (summaryText) {
            summaryText.value = 'Enter the values above to see the adjusted booking time.';
        }
        if (copyButton) copyButton.textContent = 'Copy summary';
        if (validationMessage) {
            validationMessage.textContent = '';
            validationMessage.classList.remove('is-error');
        }
    }

    function updateTierTags() {
        const tierInputs = [
            { tier: 1, input: document.getElementById('tier-1-minutes') },
            { tier: 2, input: document.getElementById('tier-2-minutes') },
            { tier: 3, input: document.getElementById('tier-3-minutes') },
            { tier: 4, input: document.getElementById('tier-4-minutes') }
        ];

        if (finalTierTags) {
            finalTierTags.innerHTML = '';
            tierInputs.forEach(({ tier, input }) => {
                const value = Number(input.value) || 0;
                if (value > 0) {
                    const tag = document.createElement('span');
                    tag.className = 'final-tier-tag';
                    tag.textContent = `Tier ${tier}: ${value} min`;
                    finalTierTags.appendChild(tag);
                }
            });
        }
    }

    function syncFinalTier() {
        const tierMinutes = {
            1: Number(document.getElementById('tier-1-minutes').value) || 0,
            2: Number(document.getElementById('tier-2-minutes').value) || 0,
            3: Number(document.getElementById('tier-3-minutes').value) || 0,
            4: Number(document.getElementById('tier-4-minutes').value) || 0
        };

        const highestTierWithTime = Object.entries(tierMinutes)
            .filter(([, minutes]) => minutes > 0)
            .map(([tier]) => Number(tier))
            .sort((a, b) => b - a)[0];

        if (tierSelect) {
            tierSelect.value = highestTierWithTime ? String(highestTierWithTime) : '3';
        }

        if (finalTierDisplay) {
            finalTierDisplay.textContent = highestTierWithTime ? `Tier ${highestTierWithTime}` : 'Not set yet';
        }

        return highestTierWithTime;
    }

    function validateTierSelection() {
        const highestTierWithTime = syncFinalTier();

        if (!highestTierWithTime) {
            if (validationMessage) {
                validationMessage.textContent = 'Enter at least one tier minute value before calculating.';
                validationMessage.classList.add('is-error');
            }
            return false;
        }

        if (validationMessage) {
            validationMessage.textContent = `Final ticket tier set to Tier ${highestTierWithTime} based on the entered values.`;
            validationMessage.classList.remove('is-error');
        }

        return true;
    }

    function openTierModal(title, contentHtml) {
        if (tierModalTitle) {
            tierModalTitle.textContent = title;
        }
        if (tierModalContent) {
            tierModalContent.innerHTML = contentHtml;
        }
        if (tierModal) {
            tierModal.classList.add('is-open');
            tierModal.setAttribute('aria-hidden', 'false');
        }
    }

    if (tierSelect && tierInfoButton) {
        tierInfoButton.addEventListener('click', function (event) {
            event.preventDefault();
            openTierModal(
                'How the final ticket tier is set',
                '<p>Set the final ticket tier to the highest tier that required the highest level of skill for the work covered by the ticket. A ticket can include work from different tiers to get completed, and the final tier should reflect the highest level of skill required.</p><p>Use the entered minute values to confirm that the final tier matches the highest tier with recorded work.</p>'
            );
        });

        if (tierModalClose && tierModal) {
            tierModalClose.addEventListener('click', function () {
                tierModal.classList.remove('is-open');
                tierModal.setAttribute('aria-hidden', 'true');
            });
        }

        if (tierModal) {
            tierModal.addEventListener('click', function (event) {
                if (event.target === tierModal) {
                    tierModal.classList.remove('is-open');
                    tierModal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        tierSelect.addEventListener('change', function () {
            if (finalTierDisplay) {
                finalTierDisplay.textContent = `Tier ${tierSelect.value}`;
            }
            validateTierSelection();
        });
    }

    form.querySelectorAll('.tier-info-button').forEach((button) => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const tier = button.getAttribute('data-tier-info');
            const guidance = {
                1: {
                    title: 'Tier 1 guidance',
                    content: '<p>Use Tier 1 for simple work that does not require technician input. This is for someone who knows CyberJo and the client information basics, and can handle the work without deeper technical support.</p><p>Travel time, waiting time, and idle time is also included in Tier 1 if that time is not spent elsewhere.</p>'
                },
                2: {
                    title: 'Tier 2 guidance',
                    content: '<p>Use Tier 2 for junior or basic developing technician work such as desktop support, basic website updates, and basic implementation work.</p>'
                },
                3: {
                    title: 'Tier 3 guidance',
                    content: '<p>Use Tier 3 for mid-level technical work such as backend server work, escalations, and more technical troubleshooting.</p>'
                },
                4: {
                    title: 'Tier 4 guidance',
                    content: '<p>Use Tier 4 for senior, specialist, or advanced work such as architecture, specialist support, manager-level input, or expert-level work.</p>'
                }
            };
            const selected = guidance[tier] || guidance[3];
            openTierModal(selected.title, selected.content);
        });
    });

    form.querySelectorAll('input[id^="tier-"]').forEach((input) => {
        input.addEventListener('input', function () {
            updateTierTags();
            validateTierSelection();
        });
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!validateTierSelection()) {
            return;
        }

        const finalTier = Number(document.getElementById('final-tier').value);
        const tierMinutes = {
            1: Number(document.getElementById('tier-1-minutes').value) || 0,
            2: Number(document.getElementById('tier-2-minutes').value) || 0,
            3: Number(document.getElementById('tier-3-minutes').value) || 0,
            4: Number(document.getElementById('tier-4-minutes').value) || 0
        };

        let totalVu = 0;

        Object.entries(tierMinutes).forEach(([tier, minutes]) => {
            if (!minutes) return;
            const tierNumber = Number(tier);
            totalVu += minutes / minutesPerVu[tierNumber];
        });

        const adjustedMinutes = totalVu * minutesPerVu[finalTier];
        const adjustedHours = adjustedMinutes / 60;

        const roundedVu = Number(totalVu.toFixed(2));
        const roundedMinutes = Number(adjustedMinutes.toFixed(2));
        const roundedHours = Number(adjustedHours.toFixed(2));

        const breakdownLines = Object.entries(tierMinutes)
            .filter(([, minutes]) => minutes > 0)
            .map(([tier, minutes]) => {
                const tierNumber = Number(tier);
                const tierVu = Number((minutes / minutesPerVu[tierNumber]).toFixed(2));
                return `Tier ${tierNumber}: ${minutes} minutes (${tierVu} VU)`;
            });

        if (minutesEl) minutesEl.textContent = `${roundedMinutes} minutes`;
        if (vuEl) vuEl.textContent = `${roundedVu} VU`;
        if (hoursEl) hoursEl.textContent = `${roundedHours} hours`;

        if (summaryText) {
            summaryText.value = [
                'CyberJo billing summary',
                `Final ticket tier: Tier ${finalTier}`,
                'Time breakdown:',
                ...breakdownLines,
                `Total VU: ${roundedVu}`,
                `Adjusted booking time: ${roundedMinutes} minutes (${roundedHours} hours)`
            ].join('\n');
        }
    });

    form.addEventListener('reset', function () {
        window.setTimeout(function () {
            resetResult();
            syncFinalTier();
            updateTierTags();
        }, 0);
    });

    if (copyButton && summaryText) {
        copyButton.addEventListener('click', async function () {
            const textToCopy = summaryText.value;

            if (!textToCopy || textToCopy.includes('Enter the values above')) {
                return;
            }

            try {
                await navigator.clipboard.writeText(textToCopy);
                copyButton.textContent = 'Copied!';
                window.setTimeout(function () {
                    copyButton.textContent = 'Copy summary';
                }, 1600);
            } catch (error) {
                summaryText.focus();
                summaryText.select();
                copyButton.textContent = 'Select to copy';
                window.setTimeout(function () {
                    copyButton.textContent = 'Copy summary';
                }, 1600);
            }
        });
    }

    syncFinalTier();
    updateTierTags();
    resetResult();
}
