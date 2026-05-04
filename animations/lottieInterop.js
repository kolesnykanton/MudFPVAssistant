// wwwroot/js/lottieInterop.js

window.lottieInterop = {
    instances: {},

    load(containerId, jsonPath, segmentName) {
        const segments = {
            up_left:     [0,  20],
            up_center:   [30, 50],
            up_right:    [60, 80],
            down_left:   [90, 110],
            down_center: [120,140],
            down_right:  [150,170],
            center_right: [180,200],
            center_left:[210,230]
        };

        const seg = segments[segmentName];
        if (!seg) {
            console.warn(`Unknown segment: ${segmentName}`);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        let direction = 1;
        const anim = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: jsonPath
        });

        this.instances[containerId] = { anim, seg, direction };

        anim.addEventListener('DOMLoaded', () => {
            anim.playSegments(seg, true);

            const svg = container.querySelector('svg');
            if (!svg) return;

            // Замінюємо білий fill на сірий
            svg.querySelectorAll('[fill]').forEach(el => {
                const f = (el.getAttribute('fill') || '').trim().toLowerCase();
                if (f === '#ffffff' || f === 'white' || (f.startsWith('rgb') && f.includes('255,255,255'))) {
                    el.setAttribute('fill', '#5c5c5c');
                }
            });

            // Замінюємо білий stroke на сірий
            svg.querySelectorAll('[stroke]').forEach(el => {
                const s = (el.getAttribute('stroke') || '').trim().toLowerCase();
                if (s === '#ffffff' || s === 'white' || (s.startsWith('rgb') && s.includes('255,255,255'))) {
                    el.setAttribute('stroke', '#5c5c5c');
                }
            });
        });

        anim.addEventListener('complete', () => {
            const inst = this.instances[containerId];
            inst.direction *= -1;
            anim.setDirection(inst.direction);

            const nextSeg = inst.direction > 0
                ? inst.seg
                : inst.seg.slice().reverse();

            anim.playSegments(nextSeg, true);
        });
    },

    changeSegment(containerId, segmentName) {
        const segments = {
            up_left:     [0,  20],
            up_center:   [30, 50],
            up_right:    [60, 80],
            down_left:   [90, 110],
            down_center: [120,140],
            down_right:  [150,170],
            center_right: [180,200],
            center_left:[210,230]
        };

        const inst = this.instances[containerId];
        const seg = segments[segmentName];
        if (!inst || !seg) return;

        inst.seg = seg;
        inst.direction = 1;
        inst.anim.setDirection(1);
        inst.anim.playSegments(seg, true);
    }
};
