// Robust details expand/collapse animation using transitionend.
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('details.small-italic').forEach(function (det) {
            var content = det.querySelector('.details-content');
            if (!content) return;

            // Ensure initial state
            content.style.overflow = 'hidden';
            content.style.maxHeight = det.open ? content.scrollHeight + 'px' : '0px';
            content.style.opacity = det.open ? '1' : '0';

            // Transition end handler to clear maxHeight when fully expanded
            function onTransitionEnd(e) {
                if (e.propertyName !== 'max-height') return;
                if (det.open) {
                    // allow natural height after expanding
                    content.style.maxHeight = 'none';
                }
            }

            det.addEventListener('toggle', function () {
                // remove any previous listener to avoid duplicates
                content.removeEventListener('transitionend', onTransitionEnd);

                if (det.open) {
                    // set to the exact content height to animate from 0 -> height
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                    // listen for transition end to clear maxHeight
                    content.addEventListener('transitionend', onTransitionEnd);
                } else {
                    // If currently 'none', switch to measured px so transition can run
                    if (content.style.maxHeight === 'none' || content.style.maxHeight === '') {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                    // force reflow to ensure the browser picks up the starting height
                    void content.offsetHeight;
                    // then animate to zero
                    content.style.maxHeight = '0px';
                    content.style.opacity = '0';
                }
            });
        });
    });