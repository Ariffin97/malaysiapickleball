(function(){
  const e = React.createElement;
  const { useMemo, useState } = React;

  function TableHeader(){
    return e('thead', { className: 'bg-gray-50' },
      e('tr', null,
        e('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, '#'),
        e('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Venue Name'),
        e('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Address'),
        e('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Booking Site')
      )
    );
  }

  function VenuesTable({ venues }){
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
      if (!query) return venues;
      const q = query.toLowerCase();
      return (venues||[]).filter(v =>
        (v.name||'').toLowerCase().includes(q) ||
        (v.address||'').toLowerCase().includes(q)
      );
    }, [venues, query]);

    return e('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
      e('div', { className: 'flex items-center justify-between mb-4' },
        e('div', { className: 'text-sm text-gray-600' }, `${filtered.length} venues`),
        e('input', {
          className: 'border rounded-lg px-3 py-2 w-64',
          placeholder: 'Search venues...',
          value: query,
          onChange: (ev) => setQuery(ev.target.value)
        })
      ),
      e('div', { className: 'overflow-x-auto' },
        e('table', { className: 'min-w-full divide-y divide-gray-200' },
          e(TableHeader),
          e('tbody', { className: 'bg-white divide-y divide-gray-200' },
            filtered.map((v, idx) => e('tr', { key: v._id || v.slug || idx },
              e('td', { className: 'px-4 py-3 whitespace-nowrap text-sm text-gray-700' }, idx + 1),
              e('td', { className: 'px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600' },
                e('a', { href: `/venue/${encodeURIComponent(v.slug)}` }, v.name || '-')
              ),
              e('td', { className: 'px-4 py-3 whitespace-pre-wrap text-sm text-gray-700' }, v.address || '-'),
              e('td', { className: 'px-4 py-3 whitespace-nowrap text-sm' },
                v.bookingUrl
                  ? e('a', { className: 'text-green-600 hover:text-green-800 underline', href: v.bookingUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Book')
                  : e('span', { className: 'text-gray-400' }, '—')
              )
            ))
          )
        )
      )
    );
  }

  document.addEventListener('DOMContentLoaded', function(){
    var mount = document.getElementById('venues-root');
    if (!mount) return;
    var data = window.__VENUES__ || [];
    ReactDOM.createRoot(mount).render(e(VenuesTable, { venues: data }));
  });
})();


