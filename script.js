var hamburger = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobile-menu');
var hamburgerIcon = hamburger.querySelector('i');

hamburger.addEventListener('click', function () {
    mobileMenu.classList.toggle('hidden');
    if (mobileMenu.classList.contains('hidden')) {
        hamburgerIcon.className = 'fa-solid fa-bars text-2xl';
    } else {
        hamburgerIcon.className = 'fa-solid fa-xmark text-2xl';
    }
});

document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        hamburgerIcon.className = 'fa-solid fa-bars text-2xl';
    });
});

var navbar = document.getElementById('navbar');
window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
        navbar.classList.add('nav-scrolled');
    } else {
        navbar.classList.remove('nav-scrolled');
    }
});

document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    });
});

document.getElementById('reservation-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = this.querySelector('button[type="submit"]');
    var original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Odesláno!';
    btn.classList.remove('bg-hondaRed');
    btn.classList.add('bg-green-600');
    btn.disabled = true;
    var form = this;
    setTimeout(function () {
        btn.innerHTML = original;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-hondaRed');
        btn.disabled = false;
        form.reset();
    }, 3000);
});

/* ===== PHONE FORMATTING ===== */
(function () {
    var phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function () {
        var digits = this.value.replace(/\D/g, '');
        // If starts with 420, keep it; otherwise prepend 420
        if (digits.substring(0, 3) === '420') {
            digits = digits;
        } else if (digits.substring(0, 1) === '4') {
            // User is typing 420...
            digits = digits;
        } else if (digits.length > 0) {
            digits = '420' + digits;
        }
        // Format: +420 XXX XXX XXX
        var formatted = '';
        if (digits.length > 0) {
            formatted = '+' + digits.substring(0, 3);
        }
        if (digits.length > 3) {
            formatted += ' ' + digits.substring(3, 6);
        }
        if (digits.length > 6) {
            formatted += ' ' + digits.substring(6, 9);
        }
        if (digits.length > 9) {
            formatted += ' ' + digits.substring(9, 12);
        }
        this.value = formatted;
    });
    // Auto-fill +420 on focus if empty
    phoneInput.addEventListener('focus', function () {
        if (!this.value) {
            this.value = '+420 ';
        }
    });
})();

/* ===== DATE STRIP ===== */
(function () {
    var strip = document.getElementById('date-strip');
    var hiddenInput = document.getElementById('date');
    var timeSelect = document.getElementById('time');
    var days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    var months = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
    var now = new Date();
    var today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // 3-hour minimum: latest bookable time for today
    var minBookTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    // Closing time today (19:00)
    var closingHour = 19;

    // Check if today is still bookable (at least one time slot 3h+ away & before closing)
    var todayBookable = minBookTime.getHours() < closingHour ||
        (minBookTime.getHours() === closingHour && minBookTime.getMinutes() === 0);
    // If minBookTime is already past today, not bookable
    if (minBookTime.getDate() !== now.getDate()) todayBookable = false;

    var firstAvailable = -1;

    for (var i = 0; i < 14; i++) {
        var d = new Date(today);
        d.setDate(d.getDate() + i);

        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'date-chip';
        var dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) chip.classList.add('weekend');
        if (i === 0) chip.classList.add('today');

        var iso = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
        chip.dataset.date = iso;
        chip.dataset.index = i;

        chip.innerHTML =
            '<span class="chip-day">' + (i === 0 ? 'Dnes' : days[dayOfWeek]) + '</span>' +
            '<span class="chip-date">' + d.getDate() + '.</span>' +
            '<span class="chip-month">' + months[d.getMonth()] + '</span>';

        // Disable today if not bookable
        if (i === 0 && !todayBookable) {
            chip.classList.add('disabled');
            chip.disabled = true;
        } else if (firstAvailable === -1) {
            firstAvailable = i;
        }

        chip.addEventListener('click', function () {
            if (this.disabled) return;
            strip.querySelectorAll('.date-chip').forEach(function (c) { c.classList.remove('active'); });
            this.classList.add('active');
            hiddenInput.value = this.dataset.date;
            updateTimeOptions(parseInt(this.dataset.index));
        });

        strip.appendChild(chip);
    }

    // "Jiný termín" chip + hidden calendar
    var customChip = document.createElement('button');
    customChip.type = 'button';
    customChip.className = 'date-chip date-chip-custom';
    customChip.innerHTML =
        '<span class="chip-day"><i class="fa-solid fa-calendar-plus" style="font-size:0.65rem"></i></span>' +
        '<span class="chip-date" style="font-size:0.8rem;white-space:nowrap" id="custom-chip-label">Jiný</span>' +
        '<span class="chip-month">termín</span>';

    var calendarInput = document.createElement('input');
    calendarInput.type = 'date';
    calendarInput.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
    // Min date = tomorrow + 14 days (after the strip range)
    var minCustom = new Date(today);
    minCustom.setDate(minCustom.getDate() + 14);
    calendarInput.min = minCustom.getFullYear() + '-' +
        String(minCustom.getMonth() + 1).padStart(2, '0') + '-' +
        String(minCustom.getDate()).padStart(2, '0');
    strip.appendChild(calendarInput);

    customChip.addEventListener('click', function (e) {
        e.stopPropagation();
        calendarInput.style.pointerEvents = 'auto';
        calendarInput.showPicker();
    });

    calendarInput.addEventListener('change', function () {
        if (!this.value) return;
        // Deselect all chips, activate custom
        strip.querySelectorAll('.date-chip').forEach(function (c) { c.classList.remove('active'); });
        customChip.classList.add('active');
        hiddenInput.value = this.value;

        // Show selected date on the chip
        var parts = this.value.split('-');
        var selDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        var dayLabel = days[selDate.getDay()];
        document.getElementById('custom-chip-label').textContent = selDate.getDate() + '.';
        customChip.querySelector('.chip-day').innerHTML = dayLabel;
        customChip.querySelector('.chip-month').textContent = months[selDate.getMonth()];

        // Future date = no time restrictions
        updateTimeOptions(-1);
        calendarInput.style.pointerEvents = 'none';
    });

    strip.appendChild(customChip);

    // Auto-select first available
    if (firstAvailable >= 0) {
        var firstChip = strip.children[firstAvailable];
        firstChip.classList.add('active');
        hiddenInput.value = firstChip.dataset.date;
    }

    // Filter time options based on 3h rule for today
    function updateTimeOptions(dayIndex) {
        var options = timeSelect.querySelectorAll('option');
        options.forEach(function (opt) {
            opt.disabled = false;
            opt.classList.remove('text-gray-700');
        });
        if (dayIndex === 0) {
            // Disable times that are less than 3h from now
            options.forEach(function (opt) {
                if (opt.value && opt.value !== 'other' && opt.value !== '') {
                    var parts = opt.value.split(':');
                    var slotHour = parseInt(parts[0]);
                    var slotMin = parseInt(parts[1]);
                    if (slotHour < minBookTime.getHours() ||
                        (slotHour === minBookTime.getHours() && slotMin < minBookTime.getMinutes())) {
                        opt.disabled = true;
                        opt.classList.add('text-gray-700');
                    }
                }
            });
            // Reset selection if current is disabled
            if (timeSelect.selectedOptions[0] && timeSelect.selectedOptions[0].disabled) {
                timeSelect.value = '';
            }
        }
    }

    // Initial time filter
    updateTimeOptions(firstAvailable);

    /* --- Drag-to-scroll on desktop --- */
    var isDragging = false;
    var startX = 0;
    var scrollStart = 0;
    var moved = false;

    strip.addEventListener('mousedown', function (e) {
        isDragging = true;
        moved = false;
        startX = e.pageX;
        scrollStart = strip.scrollLeft;
        strip.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var dx = e.pageX - startX;
        if (Math.abs(dx) > 3) moved = true;
        strip.scrollLeft = scrollStart - dx;
    });

    window.addEventListener('mouseup', function () {
        if (isDragging) {
            isDragging = false;
            strip.style.cursor = '';
            // Prevent click if we dragged
            if (moved) {
                strip.addEventListener('click', function blocker(e) {
                    e.stopPropagation();
                    strip.removeEventListener('click', blocker, true);
                }, true);
            }
        }
    });

    // Mouse wheel horizontal scroll
    strip.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            strip.scrollLeft += e.deltaY;
        }
    }, { passive: false });
})();

/* ===== LIGHTBOX ===== */
(function () {
    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lb-img');
    var lbContainer = document.getElementById('lb-container');
    var lbCounter = document.getElementById('lb-counter');
    var lbClose = document.getElementById('lb-close');
    var lbPrev = document.getElementById('lb-prev');
    var lbNext = document.getElementById('lb-next');

    var galleryImgs = document.querySelectorAll('.gallery-img');
    var sources = [];
    galleryImgs.forEach(function (img) {
        sources.push(img.src);
    });

    var currentIndex = 0;
    var scale = 1;
    var panX = 0;
    var panY = 0;
    var isDragging = false;
    var startX = 0;
    var startY = 0;
    var lastPanX = 0;
    var lastPanY = 0;

    function showImage(idx) {
        currentIndex = idx;
        lbImg.src = sources[idx];
        lbCounter.textContent = (idx + 1) + ' / ' + sources.length;
        resetZoom();
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        applyTransform();
        lbContainer.classList.remove('zoomed');
    }

    function applyTransform() {
        lbImg.style.transform = 'scale(' + scale + ') translate(' + panX + 'px, ' + panY + 'px)';
    }

    function clampPan() {
        if (scale <= 1) {
            panX = 0;
            panY = 0;
            return;
        }
        var rect = lbImg.getBoundingClientRect();
        var contRect = lbContainer.getBoundingClientRect();
        var maxPanX = Math.max(0, (rect.width - contRect.width) / (2 * scale));
        var maxPanY = Math.max(0, (rect.height - contRect.height) / (2 * scale));
        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    }

    function openLightbox(idx) {
        showImage(idx);
        lightbox.classList.add('active');
        document.body.classList.add('lb-open');
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.classList.remove('lb-open');
        resetZoom();
    }

    function prevImage() {
        showImage((currentIndex - 1 + sources.length) % sources.length);
    }

    function nextImage() {
        showImage((currentIndex + 1) % sources.length);
    }

    // Open on gallery image click
    galleryImgs.forEach(function (img, idx) {
        img.addEventListener('click', function () {
            openLightbox(idx);
        });
    });

    // Close button
    lbClose.addEventListener('click', closeLightbox);

    // Nav buttons
    lbPrev.addEventListener('click', function (e) { e.stopPropagation(); prevImage(); });
    lbNext.addEventListener('click', function (e) { e.stopPropagation(); nextImage(); });

    // Click backdrop to close (only if not zoomed and not on controls)
    lbContainer.addEventListener('click', function (e) {
        if (e.target === lbContainer && scale <= 1) {
            closeLightbox();
        }
    });

    // Click image to toggle zoom
    lbImg.addEventListener('click', function (e) {
        if (isDragging) return;
        if (scale > 1) {
            resetZoom();
        } else {
            scale = 2.5;
            // Zoom toward click point
            var rect = lbImg.getBoundingClientRect();
            var offsetX = e.clientX - rect.left - rect.width / 2;
            var offsetY = e.clientY - rect.top - rect.height / 2;
            panX = -offsetX / scale;
            panY = -offsetY / scale;
            clampPan();
            applyTransform();
            lbContainer.classList.add('zoomed');
        }
    });

    // Scroll to zoom
    lbContainer.addEventListener('wheel', function (e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? -0.3 : 0.3;
        var newScale = Math.max(1, Math.min(5, scale + delta));

        if (newScale > 1) {
            // Zoom toward mouse position
            var rect = lbImg.getBoundingClientRect();
            var offsetX = e.clientX - rect.left - rect.width / 2;
            var offsetY = e.clientY - rect.top - rect.height / 2;
            var ratio = 1 - newScale / scale;
            panX += offsetX * ratio / newScale;
            panY += offsetY * ratio / newScale;
        }

        scale = newScale;
        if (scale <= 1) {
            resetZoom();
        } else {
            clampPan();
            applyTransform();
            lbContainer.classList.add('zoomed');
        }
    }, { passive: false });

    // Mouse drag panning
    lbImg.addEventListener('mousedown', function (e) {
        if (scale <= 1) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastPanX = panX;
        lastPanY = panY;
        lbContainer.classList.add('dragging');
    });

    window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        panX = lastPanX + (e.clientX - startX) / scale;
        panY = lastPanY + (e.clientY - startY) / scale;
        clampPan();
        applyTransform();
    });

    window.addEventListener('mouseup', function () {
        if (isDragging) {
            // Small delay to prevent click-to-zoom firing after drag
            setTimeout(function () { isDragging = false; }, 50);
            lbContainer.classList.remove('dragging');
        }
    });

    // Touch pinch-to-zoom
    var lastTouchDist = 0;
    lbContainer.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
            lastTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        } else if (e.touches.length === 1 && scale > 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            lastPanX = panX;
            lastPanY = panY;
        }
    }, { passive: true });

    lbContainer.addEventListener('touchmove', function (e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            var dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            var delta = (dist - lastTouchDist) * 0.01;
            scale = Math.max(1, Math.min(5, scale + delta));
            lastTouchDist = dist;
            if (scale <= 1) {
                resetZoom();
            } else {
                clampPan();
                applyTransform();
                lbContainer.classList.add('zoomed');
            }
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            e.preventDefault();
            panX = lastPanX + (e.touches[0].clientX - startX) / scale;
            panY = lastPanY + (e.touches[0].clientY - startY) / scale;
            clampPan();
            applyTransform();
        }
    }, { passive: false });

    lbContainer.addEventListener('touchend', function () {
        isDragging = false;
        lastTouchDist = 0;
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });
})();
