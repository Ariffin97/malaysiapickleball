import { useState, useEffect, useCallback } from 'react';
import './GatoradeChampionship.css';

function GatoradeChampionship() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const images = [
    { src: '/prizepool.jpeg', alt: 'Prize Pool', title: 'Prize Pool' },
    { src: '/register.jpeg', alt: 'Registration', title: 'Registration Information' },
    { src: '/juniors.jpeg', alt: 'Juniors Category', title: 'Juniors Category' },
    { src: '/adults.jpeg', alt: 'Adults Category', title: 'Adults Category' },
    { src: '/senior.jpeg', alt: 'Senior Category', title: 'Senior Category' },
    { src: '/schedule.jpeg', alt: 'Schedule', title: 'Tournament Schedule' }
  ];

  const openImage = (index) => {
    // Get the actual image index (0-5) since we have 3 copies
    const actualIndex = index % images.length;
    setSelectedImageIndex(actualIndex);
  };

  const closeImage = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeImage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImageIndex, nextImage, prevImage, closeImage]);

  return (
    <div className="gatorade-championship">
      <section className="championship-hero">
        <div className="championship-hero-content">
          <h1>Gatorade Malaysia Closed 2025</h1>
          <h2>Pickleball Championship</h2>
        </div>
      </section>

      <section className="championship-content">
        <div className="carousel-container">
          <div className="carousel-track">
            {/* Render images 3 times for seamless infinite loop */}
            {[...images, ...images, ...images].map((image, index) => (
              <div
                key={`${image.alt}-${index}`}
                className="carousel-image-card"
                onClick={() => openImage(index)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><p>Image not found</p></div>';
                  }}
                />
                <div className="image-overlay">
                  <i className="fas fa-search-plus"></i>
                  <span>Click to view</span>
                </div>
                <div className="image-title">{image.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Image Lightbox */}
      {selectedImageIndex !== null && (
        <div className="lightbox-overlay" onClick={closeImage}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="lightbox-header">
              <div className="lightbox-title">
                <h3>{images[selectedImageIndex].title}</h3>
                <p className="lightbox-counter">
                  {selectedImageIndex + 1} / {images.length}
                </p>
              </div>
              <button className="lightbox-close" onClick={closeImage} title="Close (Esc)">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Main Image */}
            <div className="lightbox-content">
              <button
                className="lightbox-nav lightbox-prev"
                onClick={prevImage}
                title="Previous (←)"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <div className="lightbox-image-wrapper">
                <img
                  src={images[selectedImageIndex].src}
                  alt={images[selectedImageIndex].alt}
                  className="lightbox-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <button
                className="lightbox-nav lightbox-next"
                onClick={nextImage}
                title="Next (→)"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="lightbox-thumbnails">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image.src} alt={image.alt} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GatoradeChampionship;
