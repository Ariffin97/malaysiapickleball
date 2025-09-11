// Tournament Management React Component
(function() {
  'use strict';
  
  const { useState, useEffect, createElement: h } = React;

  // Simple tournament card component
  function TournamentCard(props) {
    const tournament = props.tournament;
    
    const getStatusColor = function(status) {
      const colors = {
        'upcoming': 'bg-blue-500',
        'ongoing': 'bg-green-500', 
        'completed': 'bg-gray-500',
        'cancelled': 'bg-red-500'
      };
      return colors[status] || 'bg-blue-500';
    };

    const getStatusLabel = function(status) {
      const labels = {
        'upcoming': 'UPCOMING',
        'ongoing': 'ONGOING',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED'
      };
      return labels[status] || 'UPCOMING';
    };

    const hasPhone = !!tournament.phoneNumber;
    const hasVenue = !!tournament.venue;
    const hasOrganizer = !!tournament.organizer;
    const isApiKeyTournament = tournament.source === 'api-key';
    const isPortalTournament = tournament.source === 'portal';

    // Status spans removed - no status badges at top of cards

    const formatDate = function(dateStr) {
      if (!dateStr) return 'Not set';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-MY', { 
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    // Build detail items
    const detailItems = [];
    
    // Portal Tournament IDs (show the original portal-generated IDs)
    if (isPortalTournament && (tournament.id || tournament.applicationId)) {
      const portalIds = [];
      
      // Portal Tournament ID
      if (tournament.id) {
        portalIds.push(h('div', { key: 'portal-id' }, [
          h('span', { key: 'portal-id-label', className: "text-xs text-gray-500 block" }, 'Portal Tournament ID:'),
          h('span', { key: 'portal-id-value', className: "text-sm font-mono text-blue-700 select-all" }, tournament.id)
        ]));
      }
      
      
      if (portalIds.length > 0) {
        detailItems.push(h('div', { 
          key: 'portal-ids',
          className: "bg-blue-50 p-3 rounded border border-blue-200 space-y-2" 
        }, [
          h('div', { key: 'portal-ids-header', className: "flex items-center space-x-2 mb-2" }, [
                h('span', { key: 'portal-title', className: "text-sm font-semibold text-blue-800" }, 'Portal IDs')
          ]),
          ...portalIds
        ]));
      }
    }
    
    // MongoDB ID (for non-portal tournaments or as fallback)
    if (tournament._id && !isPortalTournament) {
      detailItems.push(h('div', { 
        key: 'mongodb-id',
        className: "flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-200" 
      }, [
        
        h('div', { key: 'db-content' }, [
          h('span', { key: 'db-label', className: "text-xs text-gray-500 block" }, 'Database ID:'),
          h('span', { key: 'db-value', className: "text-sm font-mono text-gray-700 select-all" }, tournament._id)
        ])
      ]));
    }
    
    // Dates (check multiple possible field names)
    const startDate = tournament.startDate || tournament.eventStartDate || tournament.dateStart;
    const endDate = tournament.endDate || tournament.eventEndDate || tournament.dateEnd;
    
    if (startDate || endDate) {
      detailItems.push(h('div', { 
        key: 'dates',
        className: "flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200" 
      }, [
        h('div', { key: 'date-content' }, [
          h('span', { key: 'date-label', className: "text-xs text-gray-500 block" }, 'Event Dates:'),
          h('span', { key: 'date-range', className: "text-sm font-semibold text-blue-700" }, 
            (startDate ? formatDate(startDate) : 'Start date not set') + 
            (endDate && endDate !== startDate ? 
              ' - ' + formatDate(endDate) : 
              (endDate && endDate === startDate ? '' : ' - End date not set'))
          )
        ])
      ]));
    } else {
      // Always show date section even if no dates are set
      detailItems.push(h('div', { 
        key: 'dates-missing',
        className: "flex items-center space-x-2 bg-yellow-50 p-2 rounded border border-yellow-200" 
      }, [
        
        h('div', { key: 'date-content' }, [
          h('span', { key: 'date-label', className: "text-xs text-gray-500 block" }, 'Event Dates:'),
          h('span', { key: 'date-range', className: "text-sm font-semibold text-yellow-700" }, 'Dates not specified')
        ])
      ]));
    }
    
    // Venue and Location
    if (tournament.venue || tournament.city || tournament.state) {
      const locationText = [tournament.venue, tournament.city, tournament.state].filter(Boolean).join(', ');
      detailItems.push(h('div', { 
        key: 'venue',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'venue-text' }, locationText)
      ]));
    }
    
    // Organizer
    if (tournament.organizer) {
      detailItems.push(h('div', { 
        key: 'organizer',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'organizer-text' }, tournament.organizer)
      ]));
    }
    
    // Person in Charge
    if (tournament.personInCharge) {
      detailItems.push(h('div', { 
        key: 'person-in-charge',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'person-text' }, tournament.personInCharge)
      ]));
    }
    
    // Phone Numbers (check multiple possible field names from portal)
    const phoneNumber = tournament.phoneNumber || tournament.phone || tournament.contactNumber || 
                       tournament.contactPhone || tournament.personInChargePhone || tournament.organizerPhone ||
                       tournament.mobile || tournament.mobileNumber || tournament.contactMobile ||
                       tournament.phoneNo || tournament.telNumber || tournament.telephone || 
                       tournament.telContact;
    
    if (phoneNumber) {
      detailItems.push(h('div', { 
        key: 'phone',
        className: "flex items-center space-x-2 bg-green-50 p-2 rounded border border-green-200" 
      }, [
        
        h('div', { key: 'phone-content' }, [
          h('span', { key: 'phone-label', className: "text-xs text-gray-500 block" }, 'Phone Number:'),
          h('a', { 
            key: 'phone-text', 
            href: `tel:${phoneNumber}`,
            className: "text-sm font-semibold text-green-700 hover:text-green-900 hover:underline"
          }, phoneNumber)
        ])
      ]));
    } else {
      // Show missing phone number
      detailItems.push(h('div', { 
        key: 'phone-missing',
        className: "flex items-center space-x-2 bg-yellow-50 p-2 rounded border border-yellow-200" 
      }, [
        
        h('div', { key: 'phone-content' }, [
          h('span', { key: 'phone-label', className: "text-xs text-gray-500 block" }, 'Phone Number:'),
          h('span', { key: 'phone-text', className: "text-sm font-semibold text-yellow-700" }, 'Not provided'),
          h('div', { key: 'phone-debug', className: "text-xs text-gray-400 mt-1" }, 
            `Debug: Available phone fields: ${Object.keys(tournament).filter(k => 
              k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || 
              k.toLowerCase().includes('tel') || k.toLowerCase().includes('contact')
            ).join(', ') || 'none'}`)
        ])
      ]));
    }
    
    
    // Max Participants
    if (tournament.maxParticipants) {
      detailItems.push(h('div', { 
        key: 'max-participants',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'participants-text' }, `Max: ${tournament.maxParticipants} participants`)
      ]));
    }
    
    // Contact Email
    if (tournament.contactEmail) {
      detailItems.push(h('div', { 
        key: 'email',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'email-text', className: "text-sm" }, tournament.contactEmail)
      ]));
    }
    
    // Entry Fee
    if (tournament.entryFee !== undefined && tournament.entryFee !== null) {
      detailItems.push(h('div', { 
        key: 'entry-fee',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'fee-text' }, `Entry Fee: RM${tournament.entryFee}`)
      ]));
    }
    
    // Tournament Type/Format
    if (tournament.tournamentType || tournament.format) {
      const typeText = tournament.tournamentType || tournament.format;
      detailItems.push(h('div', { 
        key: 'type',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'type-text' }, `Type: ${typeText}`)
      ]));
    }
    
    // Registration Deadline
    if (tournament.registrationDeadline) {
      detailItems.push(h('div', { 
        key: 'reg-deadline',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'deadline-text' }, `Registration Deadline: ${formatDate(tournament.registrationDeadline)}`)
      ]));
    }
    
    // Tournament Website/URL
    if (tournament.website || tournament.url) {
      const url = tournament.website || tournament.url;
      detailItems.push(h('div', { 
        key: 'website',
        className: "flex items-center space-x-2" 
      }, [
        
        h('a', { 
          key: 'web-link', 
          href: url,
          target: '_blank',
          className: "text-blue-600 hover:text-blue-800 underline text-sm break-all"
        }, url)
      ]));
    }
    
    // Additional tournament details
    if (tournament.location && tournament.location !== tournament.venue) {
      detailItems.push(h('div', { 
        key: 'location',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'location-text' }, `Location: ${tournament.location}`)
      ]));
    }
    
    // Tournament Type (additional field)
    if (tournament.type) {
      detailItems.push(h('div', { 
        key: 'tournament-level',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'level-text' }, `Level: ${tournament.type.charAt(0).toUpperCase() + tournament.type.slice(1)}`)
      ]));
    }
    
    // Contact Phone (different from phoneNumber)
    if (tournament.contactPhone && tournament.contactPhone !== tournament.phoneNumber) {
      detailItems.push(h('div', { 
        key: 'contact-phone',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'contact-phone-text' }, `Contact: ${tournament.contactPhone}`)
      ]));
    }
    
    
    // Organizing Partner
    if (tournament.organisingPartner) {
      detailItems.push(h('div', { 
        key: 'organizing-partner',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'partner-text' }, `Partner: ${tournament.organisingPartner}`)
      ]));
    }
    
    // Classification
    if (tournament.classification) {
      detailItems.push(h('div', { 
        key: 'classification',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'class-text' }, `Classification: ${tournament.classification}`)
      ]));
    }
    
    // Event Summary
    if (tournament.eventSummary && tournament.eventSummary !== tournament.description) {
      detailItems.push(h('div', { 
        key: 'event-summary',
        className: "flex items-start space-x-2 mt-2 p-2 bg-yellow-50 rounded" 
      }, [
        
        h('div', { key: 'summary-content' }, [
          h('span', { key: 'summary-label', className: "text-xs text-gray-500 block mb-1" }, 'Event Summary:'),
          h('span', { key: 'summary-text', className: "text-sm text-gray-700" }, 
            tournament.eventSummary.length > 150 
              ? tournament.eventSummary.substring(0, 150) + '...' 
              : tournament.eventSummary)
        ])
      ]));
    }
    
    
    // Version (if available)
    if (tournament.version !== undefined) {
      detailItems.push(h('div', { 
        key: 'version',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'version-text' }, `Version: ${tournament.version}`)
      ]));
    }
    
    // Last Modified By
    if (tournament.lastModifiedBy) {
      detailItems.push(h('div', { 
        key: 'last-modified-by',
        className: "flex items-center space-x-2" 
      }, [
        
        h('span', { key: 'modified-text' }, `Modified by: ${tournament.lastModifiedBy}`)
      ]));
    }
    
    // Created/Updated timestamps
    if (tournament.createdAt || tournament.updatedAt) {
      const timestamps = [];
      if (tournament.createdAt) {
        timestamps.push(`Created: ${formatDate(tournament.createdAt)}`);
      }
      if (tournament.updatedAt && tournament.updatedAt !== tournament.createdAt) {
        timestamps.push(`Updated: ${formatDate(tournament.updatedAt)}`);
      }
      
      detailItems.push(h('div', { 
        key: 'timestamps',
        className: "flex items-start space-x-2 text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded" 
      }, [
        
        h('div', { key: 'time-text' }, timestamps.join(' • '))
      ]));
    }
    
    // Raw data debug view (for development - shows ALL fields)
    if (window.location.search.includes('debug=true')) {
      const allFields = Object.keys(tournament).filter(key => 
        !['name', '_id', 'id', 'applicationId'].includes(key)
      ).map(key => `${key}: ${JSON.stringify(tournament[key])}`).join(', ');
      
      if (allFields) {
        detailItems.push(h('div', { 
          key: 'debug-info',
          className: "mt-2 p-2 bg-red-50 rounded border text-xs font-mono" 
        }, [
          h('div', { key: 'debug-label', className: "text-red-600 font-semibold mb-1" }, 'DEBUG - All Fields:'),
          h('div', { key: 'debug-content', className: "text-gray-600 break-all" }, allFields)
        ]));
      }
    }
    
    // Malaysia Pickleball Database Status
    if (tournament.dbCheckStatus) {
      const statusConfig = {
        'likely': { text: 'Likely in Malaysia Pickleball DB', color: 'text-green-600', bgColor: 'bg-green-50' },
        'possible': { text: 'Possibly in Malaysia Pickleball DB', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        'unlikely': { text: 'Unlikely in Malaysia Pickleball DB', color: 'text-red-600', bgColor: 'bg-red-50' },
        'unknown': { text: 'Unknown Malaysia Pickleball DB status', color: 'text-gray-600', bgColor: 'bg-gray-50' }
      };
      
      const config = statusConfig[tournament.dbCheckStatus] || statusConfig['unknown'];
      
      detailItems.push(h('div', { 
        key: 'db-status',
        className: `flex items-center space-x-2 mt-2 p-2 ${config.bgColor} rounded border-l-4 border-blue-400` 
      }, [
        h('div', { key: 'db-info' }, [
          h('span', { key: 'db-text', className: `text-sm font-medium ${config.color}` }, config.text)
        ])
      ]));
    }

    // Description (truncated if too long)
    if (tournament.description) {
      const shortDesc = tournament.description.length > 100 
        ? tournament.description.substring(0, 100) + '...' 
        : tournament.description;
      detailItems.push(h('div', { 
        key: 'description',
        className: "flex items-start space-x-2 mt-2 p-2 bg-gray-50 rounded" 
      }, [
        
        h('span', { key: 'desc-text', className: "text-sm text-gray-600" }, shortDesc)
      ]));
    }

    return h('div', { 
      className: "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col"
    }, [
      h('div', { 
        key: 'card-content',
        className: "flex justify-between items-start" 
      }, [
        h('div', { 
          key: 'tournament-info',
          className: "flex-1 min-w-0 pr-4 flex flex-col" 
        }, [
          h('div', { 
            key: 'tournament-header',
            className: "flex flex-col mb-3" 
          }, [
            h('h4', { 
              key: 'tournament-title',
              className: "font-semibold text-gray-800" 
            }, tournament.name || 'Untitled Tournament')
          ]),
          
          h('div', { 
            key: 'tournament-meta',
            className: "mb-3" 
          }, [
            
            h('p', { 
              key: 'status-info',
              className: "text-xs text-gray-500" 
            }, [
              h('span', { key: 'status-label' }, 'Status: '),
              h('span', { 
                key: 'status-value',
                className: "font-semibold capitalize" 
              }, tournament.status || 'upcoming')
            ])
          ]),

          h('div', { 
            key: 'tournament-details',
            className: "mt-3 space-y-2 text-sm text-gray-600 flex-grow" 
          }, detailItems)
        ]),
        
        h('div', { 
          key: 'status-badge',
          className: "ml-4" 
        }, [
          h('div', { 
            key: 'status-badge-pill',
            className: getStatusColor(tournament.status) + " text-white px-3 py-1 rounded-full text-xs font-semibold"
          }, getStatusLabel(tournament.status))
        ])
      ])
    ]);
  }

  // Tournament Content Area
  function TournamentContent(props) {
    const tournaments = props.tournaments;

    if (tournaments.length === 0) {
      return h('div', { 
        className: "text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" 
      }, [
        h('div', { key: 'empty-icon', className: "text-6xl mb-4 opacity-50" }, '📁'),
        h('h3', { key: 'empty-title', className: "text-lg font-semibold text-gray-600 mb-2" }, 
          'No tournaments found'),
        h('p', { key: 'empty-desc', className: "text-gray-500" }, 
          'Tournaments will appear here when they are created')
      ]);
    }

    return h('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
      tournaments.map(function(tournament, index) {
        return h(TournamentCard, { 
          key: tournament._id || tournament.name || `tournament-${index}`,
          tournament: tournament
        });
      })
    );
  }

  // Main tournaments app component
  function TournamentsApp() {
    const tournamentsState = useState([]);
    const tournaments = tournamentsState[0];
    const setTournaments = tournamentsState[1];
    
    const statsState = useState({
      total: 0,
      local: 0,
      portal: 0,
      apiKey: 0,
      inMainDb: 0,
      likelyInMainDb: 0
    });
    const stats = statsState[0];
    const setStats = statsState[1];

    const portalStatusState = useState('unknown');
    const portalStatus = portalStatusState[0];
    const setPortalStatus = portalStatusState[1];

    const portalErrorState = useState(null);
    const portalError = portalErrorState[0];
    const setPortalError = portalErrorState[1];

    const loadingState = useState(true);
    const loading = loadingState[0];
    const setLoading = loadingState[1];

    const errorState = useState(null);
    const error = errorState[0];
    const setError = errorState[1];

    const lastUpdateState = useState(new Date());
    const lastUpdate = lastUpdateState[0];
    const setLastUpdate = lastUpdateState[1];

    // Load tournaments data
    const fetchTournaments = function() {
      setLoading(true);
      setError(null);
      
      fetch('/api/admin/tournaments-data')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to load tournaments');
          }
          return response.json();
        })
        .then(function(data) {
          setTournaments(data.tournaments || []);
          setStats(data.stats || { total: 0, local: 0, portal: 0, apiKey: 0, inMainDb: 0, likelyInMainDb: 0 });
          setPortalStatus(data.portalStatus || 'unknown');
          setPortalError(data.portalError || null);
          setLastUpdate(new Date());
          setLoading(false);
        })
        .catch(function(err) {
          console.error('Tournament loading error:', err);
          setError(err.message);
          setLoading(false);
        });
    };

    // Load tournaments on component mount
    useEffect(function() {
      fetchTournaments();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(function() {
      const interval = setInterval(fetchTournaments, 30000);
      return function() {
        clearInterval(interval);
      };
    }, []);

    if (loading) {
      return h('div', { className: "flex items-center justify-center py-16" }, [
        h('div', { 
          key: 'loading-spinner',
          className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" 
        }),
        h('span', { 
          key: 'loading-text',
          className: "ml-4 text-gray-600" 
        }, 'Loading tournaments...')
      ]);
    }

    if (error) {
      return h('div', { className: "text-center py-16" }, [
        h('div', { key: 'error-icon', className: "text-6xl mb-4 opacity-50" }, '⚠️'),
        h('h3', { key: 'error-title', className: "text-lg font-semibold text-red-600 mb-2" }, 'Error Loading Tournaments'),
        h('p', { key: 'error-desc', className: "text-gray-500 mb-4" }, error),
        h('button', {
          key: 'retry-btn',
          onClick: fetchTournaments,
          className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        }, 'Retry')
      ]);
    }

    return h('div', { className: "space-y-6" }, [
      // Header section
      h('div', { key: 'header-section', className: "flex justify-between items-center" }, [
        h('div', { key: 'title-section' }, [
          h('h1', { 
            key: 'main-title',
            className: "text-2xl font-bold text-gray-900" 
          }, 'View Tournaments'),
          h('div', { 
            key: 'subtitle',
            className: "text-gray-600 mt-1 space-y-1" 
          }, [
            h('p', { 
              key: 'total-stats',
              className: "text-sm" 
            }, `${stats.total} tournaments total • ${stats.apiKey} from API key • ${stats.portal} from portal`),
            h('p', { 
              key: 'db-stats',
              className: "text-xs text-gray-500" 
            }, `Malaysia Pickleball DB: ${stats.inMainDb} confirmed • ${stats.likelyInMainDb} likely in main database`),
            h('div', { 
              key: 'portal-status',
              className: "flex items-center space-x-2 text-xs" 
            }, [
              h('span', { 
                key: 'status-indicator',
                className: `inline-block w-2 h-2 rounded-full ${portalStatus === 'disabled' ? 'bg-gray-400' : portalStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`
              }),
              h('span', { 
                key: 'status-text',
                className: portalStatus === 'connected' ? 'text-green-600' : portalStatus === 'disabled' ? 'text-gray-600' : 'text-red-600'
              }, portalStatus === 'connected' ? 'New Portal API Connected' : portalStatus === 'disabled' ? 'Local Database Mode' : `New Portal API ${portalStatus}${portalError ? `: ${portalError}` : ''}`),
            ])
          ])
        ]),
        h('div', { key: 'actions-section', className: "flex space-x-3" }, [
          h('span', { 
            key: 'last-updated',
            className: "text-xs text-gray-500 self-center" 
          }, 'Updated: ' + lastUpdate.toLocaleTimeString()),
          h('button', {
            key: 'refresh-btn',
            onClick: fetchTournaments,
            className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          }, '🔄 Refresh')
        ])
      ]),

      // Tournament content
      h('div', { key: 'content-section' }, [
        h(TournamentContent, { 
          key: 'tournament-content',
          tournaments: tournaments
        })
      ])
    ]);
  }

  // Expose component globally
  window.TournamentsApp = TournamentsApp;
})();