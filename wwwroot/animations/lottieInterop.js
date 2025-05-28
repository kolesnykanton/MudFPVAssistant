// wwwroot/js/lottieInterop.js

window.lottieInterop = {
    // Сховище для кількох анімацій
    instances: {},

    load: function (containerId, jsonPath, segmentName) {
        const segments = {
            up_left: [0, 20],
            up_center: [30, 50],
            up_right: [60, 80],
            down_left: [90, 110],
            down_center: [120, 140],
            down_right: [150, 170],
            left_center: [180, 200],
            right_center: [210, 230]
        };

        const segment = segments[segmentName];
        if (!segment) {
            console.warn(`Unknown segment: ${segmentName}`);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        let direction = 1;

        const animation = lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: jsonPath
        });

        // Зберігаємо стан анімації та сегмент
        lottieInterop.instances[containerId] = {
            animation: animation,
            currentSegment: segment,
            direction: direction
        };

        animation.addEventListener('DOMLoaded', () => {
            animation.playSegments(segment, true);
        });

        animation.addEventListener('complete', () => {
            const instance = lottieInterop.instances[containerId];
            instance.direction *= -1;
            animation.setDirection(instance.direction);
            const seg = instance.currentSegment;
            animation.playSegments(
                instance.direction > 0 ? seg : seg.slice().reverse(),
                true
            );
        });
    },

    changeSegment: function (containerId, segmentName) {
        const segments = {
            up_left: [0, 20],
            up_center: [30, 50],
            up_right: [60, 80],
            down_left: [90, 110],
            down_center: [120, 140],
            down_right: [150, 170],
            left_center: [180, 200],
            right_center: [210, 230]
        };

        const instance = lottieInterop.instances[containerId];
        const segment = segments[segmentName];
        if (!segment || !instance) return;

        instance.currentSegment = segment;
        instance.direction = 1;
        const animation = instance.animation;
        animation.setDirection(1);
        animation.playSegments(segment, true);
    }
};
