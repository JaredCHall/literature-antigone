/**
 * Initializes the gallery mode toggle which activates when
 * GUI icon clicked or letter 'G' is pressed on keyboard.
 */
function initGalleryModeToggle() {
    const toggleBtn = document.getElementById('gallery-toggle');

    function toggleGallery() {
        const isGallery = document.body.classList.toggle('gallery-mode');
        toggleBtn.innerHTML = isGallery ? '&#9729;' : '&#9728;';
        toggleBtn.title = isGallery ? 'Show text (or press G)' : 'Hide text (or press G)';
    }

    toggleBtn.addEventListener('click', toggleGallery);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'g' || e.key === 'G') toggleGallery();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initGalleryModeToggle();

    const director = new SceneDirector(
        document,
        [
            'images/antigone-ismene.webp',
            'images/creon-decree.webp',
            'images/comic-guard.webp',
            'images/chorus.webp',
            'images/antigone-creon.webp',
            'images/creon-haemon.webp',
            'images/antigone-tomb.webp',
            'images/creon-teiresias.webp',
            'images/messengers-report.webp',
            'images/creon-collapse.webp',
        ]
    );
    director.start()
});