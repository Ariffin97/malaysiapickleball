// Nuclear fix: Tournament management with folder/tab interface
(function() {
  'use strict';
  
  // Ensure React is available
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('React libraries not available');
    return;
  }

  const { useState, useEffect } = React;
  const h = React.createElement;

  // Simple tournament card component
  function TournamentCard(props) {
    const tournament = props.tournament;
    
    const getStatusColor = function(visibility) {
      const colors = {
        'live': 'bg-green-500',
        'ready': 'bg-blue-500', 
        'draft': 'bg-gray-500',
        'archived': 'bg-orange-500'
      };
      return colors[visibility] || 'bg-gray-500';
    };

    const getStatusLabel = function(visibility) {
      const labels = {
        'live': 'LIVE',
        'ready': 'READY',
        'draft': 'DRAFT',
        'archived': 'ARCHIVED'
      };
      return labels[visibility] || 'DRAFT';
    };

    const hasPortalId = !!tournament.portalApplicationId;
    const hasPhone = !!tournament.phoneNumber;
    const hasVenue = !!tournament.venue;
    const hasOrganizer = !!tournament.organizer;

    // Create status spans with proper keys
    const statusSpans = [
      h('span', { 
        key: 'portal-status',
        className: "flex items-center " + (hasPortalId ? 'text-green-600' : 'text-red-600')
      }, (hasPortalId ? '✅' : '❌') + ' Portal ID'),
      h('span', { 
        key: 'phone-status',
        className: "flex items-center " + (hasPhone ? 'text-green-600' : 'text-red-600')
      }, (hasPhone ? '✅' : '❌') + ' Phone'),
      h('span', { 
        key: 'venue-status',
        className: "flex items-center " + (hasVenue ? 'text-green-600' : 'text-red-600')
      }, (hasVenue ? '✅' : '❌') + ' Venue'),
      h('span', { 
        key: 'organizer-status',
        className: "flex items-center " + (hasOrganizer ? 'text-green-600' : 'text-red-600')
      }, (hasOrganizer ? '✅' : '❌') + ' Organizer')
    ];

    // Create detail items with proper keys
    const detailItems = [
      tournament.startDate ? h('div', { 
        key: 'date-info',
        className: "flex items-center text-gray-600" 
      }, 
        '📅 ' + new Date(tournament.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
        (tournament.endDate ? ' to ' + new Date(tournament.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '')
      ) : h('div', { 
        key: 'date-tbd',
        className: "flex items-center text-gray-600" 
      }, '📅 Date TBD'),
      
      h('div', { 
        key: 'location-info',
        className: "flex items-center text-gray-600" 
      }, 
        '📍 ' + (tournament.venue || 'Venue TBD') + (tournament.city ? ', ' + tournament.city : '') + (tournament.state ? ', ' + tournament.state : '')
      ),
      
      h('div', { 
        key: 'organizer-info',
        className: "flex items-center text-gray-600" 
      }, 
        '🏢 Organized by: ' + (tournament.organizer || 'Not specified')
      ),
      
      tournament.phoneNumber ? h('div', { 
        key: 'phone-info',
        className: "flex items-center text-gray-600" 
      }, 
        '📞 ' + tournament.phoneNumber
      ) : null
    ].filter(Boolean);

    return h('div', {
      className: "bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:bg-white"
    }, 
      h('div', { className: "flex justify-between items-start" }, 
        h('div', { className: "flex-1" }, [
          h('div', { 
            key: 'tournament-title-section',
            className: "flex items-center gap-2 mb-1" 
          }, [
            h('h4', { 
              key: 'tournament-title',
              className: "font-semibold text-gray-800" 
            }, tournament.name || 'Untitled Tournament'),
            tournament.portalApplicationId ? h('span', { 
              key: 'portal-id-badge',
              className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
            }, [
              h('span', { key: 'portal-icon', className: "mr-1" }, '🔗'),
              'ID: ' + tournament.portalApplicationId
            ]) : null
          ]),
          
          h('div', { 
            key: 'tournament-meta',
            className: "mt-2 space-y-1" 
          }, [
            h('div', { 
              key: 'status-container',
              className: "flex space-x-4 text-sm" 
            }, statusSpans),
            
            h('p', { 
              key: 'visibility-info',
              className: "text-xs text-gray-500" 
            }, [
              'Visibility: ',
              h('span', { 
                key: 'visibility-value',
                className: "font-semibold capitalize" 
              }, tournament.visibility || 'live')
            ])
          ]),

          h('div', { 
            key: 'tournament-details',
            className: "mt-3 space-y-2 text-sm text-gray-600" 
          }, detailItems)
        ]),
        
        h('div', { 
          key: 'status-badge',
          className: "ml-4" 
        }, 
          h('div', { 
            className: getStatusColor(tournament.visibility) + " text-white px-3 py-1 rounded-full text-xs font-semibold"
          }, getStatusLabel(tournament.visibility))
        )
      )
    );
  }

  // Tab Button Component
  function TabButton(props) {
    const isActive = props.isActive;
    const onClick = props.onClick;
    const icon = props.icon;
    const label = props.label;
    const count = props.count;
    const color = props.color;

    const baseClasses = "flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer select-none";
    const activeClasses = isActive ? 
      "bg-white shadow-lg border-2 border-" + color + "-200 text-" + color + "-700 transform scale-105" : 
      "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-2 border-transparent hover:border-gray-300";

    return h('button', {
      onClick: onClick,
      className: baseClasses + " " + activeClasses
    }, [
      h('span', { key: 'tab-icon', className: "text-lg" }, icon),
      h('div', { key: 'tab-content', className: "flex flex-col items-start" }, [
        h('span', { key: 'tab-label', className: "text-sm font-semibold" }, label),
        h('span', { key: 'tab-count', className: "text-xs opacity-70" }, count + " tournaments")
      ])
    ]);
  }

  // Tournament Content Area
  function TournamentContent(props) {
    const tournaments = props.tournaments;
    const activeTab = props.activeTab;
    const color = props.color;

    if (tournaments.length === 0) {
      return h('div', { 
        className: "text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" 
      }, [
        h('div', { key: 'empty-icon', className: "text-6xl mb-4 opacity-50" }, '📁'),
        h('h3', { key: 'empty-title', className: "text-lg font-semibold text-gray-600 mb-2" }, 
          'No ' + activeTab.toLowerCase() + ' tournaments'),
        h('p', { key: 'empty-desc', className: "text-gray-500" }, 
          'Tournaments in this category will appear here')
      ]);
    }

    return h('div', { className: "space-y-4" }, 
      tournaments.map(function(tournament) {
        return h(TournamentCard, { 
          key: tournament._id || tournament.name || Math.random().toString(36),
          tournament: tournament 
        });
      })
    );
  }

  // Main tournaments app component
  function TournamentsApp() {
    const tournamentsState = useState({
      live: [],
      ready: [],
      draft: [],
      archived: []
    });
    const tournaments = tournamentsState[0];
    const setTournaments = tournamentsState[1];

    const statsState = useState({
      live: 0,
      ready: 0,
      draft: 0,
      archived: 0,
      total: 0
    });
    const stats = statsState[0];
    const setStats = statsState[1];

    const loadingState = useState(true);
    const loading = loadingState[0];
    const setLoading = loadingState[1];

    const errorState = useState(null);
    const error = errorState[0];
    const setError = errorState[1];

    const lastUpdateState = useState(new Date());
    const lastUpdate = lastUpdateState[0];
    const setLastUpdate = lastUpdateState[1];

    // Active tab state
    const activeTabState = useState('live');
    const activeTab = activeTabState[0];
    const setActiveTab = activeTabState[1];

    // Tab configurations
    const tabConfigs = [
      {
        key: 'live',
        label: 'Live',
        icon: '🟢',
        color: 'green',
        count: stats.live,
        tournaments: tournaments.live
      },
      {
        key: 'ready',
        label: 'Ready',
        icon: '🔵',
        color: 'blue',
        count: stats.ready,
        tournaments: tournaments.ready
      },
      {
        key: 'draft',
        label: 'Draft',
        icon: '⚫',
        color: 'gray',
        count: stats.draft,
        tournaments: tournaments.draft
      },
      {
        key: 'archived',
        label: 'Archived',
        icon: '🟠',
        color: 'orange',
        count: stats.archived,
        tournaments: tournaments.archived
      }
    ];

    // Get current tab config
    const currentTabConfig = tabConfigs.find(function(tab) { return tab.key === activeTab; }) || tabConfigs[0];

    // Fetch tournament data
    const fetchTournaments = function() {
      fetch('/api/admin/tournaments-data')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
          }
          return response.json();
        })
        .then(function(data) {
          setTournaments(data.tournaments);
          setStats(data.stats);
          setLastUpdate(new Date());
          setError(null);
        })
        .catch(function(err) {
          console.error('Failed to fetch tournaments:', err);
          setError(err.message);
        })
        .finally(function() {
          setLoading(false);
        });
    };

    // Set up real-time polling
    useEffect(function() {
      // Initial fetch
      fetchTournaments();

      // Set up interval for real-time updates every 30 seconds
      const interval = setInterval(fetchTournaments, 30000);

      // Cleanup interval on component unmount
      return function() {
        clearInterval(interval);
      };
    }, []);

    if (loading) {
      return h('div', { className: "flex items-center justify-center min-h-64" }, [
        h('div', { 
          key: 'loading-spinner',
          className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" 
        }),
        h('span', { 
          key: 'loading-text',
          className: "ml-3 text-gray-600" 
        }, 'Loading tournaments...')
      ]);
    }

    if (error) {
      return h('div', { className: "bg-red-50 border border-red-200 rounded-lg p-4" }, [
        h('div', { 
          key: 'error-content',
          className: "flex items-center" 
        }, [
          h('span', { 
            key: 'error-message',
            className: "text-red-700 font-medium" 
          }, 'Error loading tournaments: ' + error)
        ]),
        h('button', {
          key: 'retry-button',
          onClick: fetchTournaments,
          className: "mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        }, 'Retry')
      ]);
    }

    // Create tab buttons
    const tabButtons = tabConfigs.map(function(tab) {
      return h(TabButton, {
        key: 'tab-' + tab.key,
        isActive: activeTab === tab.key,
        onClick: function() { setActiveTab(tab.key); },
        icon: tab.icon,
        label: tab.label,
        count: tab.count,
        color: tab.color
      });
    });

    return h('div', { className: "space-y-6" }, [
      // Header with Stats Overview
      h('div', { 
        key: 'header-section',
        className: "bg-white rounded-xl shadow-lg p-6" 
      }, [
        h('div', { 
          key: 'header-content',
          className: "flex justify-between items-center mb-6" 
        }, [
          h('div', { key: 'title-section' }, [
            h('h2', { 
              key: 'main-title',
              className: "text-3xl font-bold text-gray-800 mb-2" 
            }, 'Tournament Management'),
            h('p', { 
              key: 'subtitle',
              className: "text-gray-600" 
            }, 'Organize and manage tournaments by category')
          ]),
          h('div', { 
            key: 'last-updated',
            className: "text-right" 
          }, [
            h('div', { 
              key: 'update-time',
              className: "text-sm text-gray-500" 
            }, 'Last updated: ' + lastUpdate.toLocaleTimeString()),
            h('div', { 
              key: 'total-count',
              className: "text-lg font-semibold text-gray-800" 
            }, stats.total + ' Total Tournaments')
          ])
        ]),
        
        // Quick Stats Bar
        h('div', { 
          key: 'quick-stats',
          className: "grid grid-cols-4 gap-4" 
        }, tabConfigs.map(function(tab) {
          return h('div', { 
            key: 'stat-' + tab.key,
            className: "text-center p-3 rounded-lg bg-" + tab.color + "-50 border border-" + tab.color + "-200" 
          }, [
            h('div', { 
              key: 'stat-icon',
              className: "text-2xl mb-1" 
            }, tab.icon),
            h('div', { 
              key: 'stat-number',
              className: "text-xl font-bold text-" + tab.color + "-700" 
            }, String(tab.count)),
            h('div', { 
              key: 'stat-label',
              className: "text-xs text-" + tab.color + "-600 font-medium" 
            }, tab.label.toUpperCase())
          ]);
        }))
      ]),

      // Status Legend - Clean and simple
      h('div', { 
        key: 'legend-section',
        className: "bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200" 
      }, [
        h('div', { 
          key: 'legend-items',
          className: "grid grid-cols-2 md:grid-cols-4 gap-3" 
        }, tabConfigs.map(function(tab) {
          return h('div', { 
            key: 'legend-' + tab.key,
            className: "bg-white rounded-lg p-3 border border-" + tab.color + "-200 hover:shadow-md transition-all duration-200" 
          }, [
            h('div', { 
              key: 'legend-top',
              className: "flex items-center mb-1" 
            }, [
              h('span', { 
                key: 'legend-emoji',
                className: "text-lg mr-2" 
              }, tab.icon),
              h('span', { 
                key: 'legend-label',
                className: "font-bold text-" + tab.color + "-700 text-sm" 
              }, tab.label.toUpperCase())
            ]),
            h('p', { 
              key: 'legend-desc',
              className: "text-xs text-gray-600 leading-relaxed" 
            }, getStatusDescription(tab.key))
          ]);
        }))
      ]),

      // Tab Navigation
      h('div', { 
        key: 'tab-navigation',
        className: "bg-gray-50 rounded-xl p-4" 
      }, [
        h('div', { 
          key: 'tab-buttons',
          className: "grid grid-cols-2 md:grid-cols-4 gap-3" 
        }, tabButtons)
      ]),

      // Active Tab Content
      h('div', { 
        key: 'tab-content-section',
        className: "bg-white rounded-xl shadow-lg" 
      }, [
        h('div', { 
          key: 'content-header',
          className: "p-6 border-b border-gray-200 bg-" + currentTabConfig.color + "-50" 
        }, [
          h('div', { 
            key: 'content-title',
            className: "flex items-center gap-3" 
          }, [
            h('span', { 
              key: 'content-icon',
              className: "text-3xl" 
            }, currentTabConfig.icon),
            h('div', { key: 'content-text' }, [
              h('h3', { 
                key: 'section-title',
                className: "text-2xl font-bold text-" + currentTabConfig.color + "-800" 
              }, currentTabConfig.label + ' Tournaments'),
              h('p', { 
                key: 'section-desc',
                className: "text-" + currentTabConfig.color + "-600 mt-1" 
              }, currentTabConfig.count + ' tournament' + (currentTabConfig.count === 1 ? '' : 's') + ' in this category')
            ])
          ])
        ]),
        
        h('div', { 
          key: 'content-body',
          className: "p-6" 
        }, 
          h(TournamentContent, {
            key: 'tournament-content-' + activeTab,
            tournaments: currentTabConfig.tournaments,
            activeTab: activeTab,
            color: currentTabConfig.color
          })
        )
      ])
    ]);
  }

  // Helper function for status descriptions
  function getStatusDescription(status) {
    const descriptions = {
      'live': 'Complete tournaments visible to users',
      'ready': 'Complete tournaments ready for publication',
      'draft': 'Incomplete tournaments being prepared',
      'archived': 'Past tournaments for reference'
    };
    return descriptions[status] || 'Tournament status';
  }

  // Export safely
  try {
    window.TournamentsApp = TournamentsApp;
    console.log('TournamentsApp component loaded successfully (with folder/tab interface)');
  } catch (e) {
    console.error('Error exporting TournamentsApp:', e);
  }

})();