// Simple news loading function
async function loadLatestNews() {
  try {
    const container = document.getElementById('latestNewsContainer');
    if (!container) return;
    
    const response = await fetch('/api/news/latest?limit=3');
    const data = await response.json();
    
    if (data.success && data.news && data.news.length > 0) {
      container.innerHTML = '';
      
      data.news.forEach((article, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 latest-news-card';
        
        // Simple card styling
        card.style.cssText = `
          position: static !important;
          display: block !important;
          width: 100% !important;
          height: 480px !important;
          margin: 0 !important;
          flex: 0 0 100% !important;
          box-sizing: border-box !important;
        `;
        
        const imageUrl = article.featuredImage ? `/uploads/news/${article.featuredImage.split('/').pop()}` : null;
        const mediaHtml = imageUrl 
          ? `<img src="${imageUrl}" alt="${article.title}" class="w-full h-40 object-cover" onerror="this.src='/images/defaultbg.png'">`
          : `<div class="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
               <i class="fas fa-newspaper text-4xl text-blue-400"></i>
             </div>`;
        
        const categoryColors = {
          'tournament': 'bg-blue-100 text-blue-800',
          'announcement': 'bg-red-100 text-red-800',
          'event': 'bg-purple-100 text-purple-800',
          'general': 'bg-gray-100 text-gray-800'
        };
        
        const categoryColor = categoryColors[article.category] || categoryColors.general;
        const publishDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-GB');
        
        card.innerHTML = `
          ${mediaHtml}
          <div class="p-6">
            <div class="flex items-center justify-between mb-3">
              <span class="px-3 py-1 rounded-full text-xs font-medium ${categoryColor}">
                ${article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </span>
              <span class="text-sm text-gray-500">
                <i class="fas fa-calendar mr-1"></i>${publishDate}
              </span>
            </div>
            
            <h3 class="text-lg font-bold text-gray-800 mb-2">
              ${article.title}
            </h3>
            
            <p class="text-gray-600 text-sm mb-4">
              ${article.summary || (article.content ? article.content.substring(0, 200) + '...' : '')}
            </p>
            
            <div class="flex items-center text-xs text-gray-500">
              <i class="fas fa-user mr-1"></i>
              <span>${article.author}</span>
              <span class="mx-2">•</span>
              <i class="fas fa-eye mr-1"></i>
              <span>${article.viewCount || 0}</span>
            </div>
          </div>
        `;
        
        container.appendChild(card);
      });
      
      // Simple auto-scroll
      if (data.news.length > 1) {
        let currentIndex = 0;
        setInterval(() => {
          currentIndex = (currentIndex + 1) % data.news.length;
          const scrollLeft = currentIndex * container.clientWidth;
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }, 4000);
      }
    }
  } catch (error) {
    console.error('Error loading news:', error);
  }
}