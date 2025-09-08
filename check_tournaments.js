const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/malaysia-pickleball-dev')
.then(() => {
  const Tournament = mongoose.model('Tournament', new mongoose.Schema({}, {strict: false}));
  return Tournament.find({}, {name: 1, visibility: 1, syncedFromPortal: 1, portalApplicationId: 1}).sort({name: 1});
})
.then(tournaments => {
  console.log('📊 Tournament Visibility Status (Updated):');
  console.log('==========================================');
  tournaments.forEach(t => {
    const visibility = t.visibility || 'undefined';
    const source = t.syncedFromPortal ? '(Portal)' : '(Local)';
    const portalId = t.portalApplicationId ? '[ID: ' + t.portalApplicationId + ']' : '';
    console.log(`• ${t.name}: ${visibility} ${source} ${portalId}`);
  });
  
  const visibilityStats = {
    draft: tournaments.filter(t => t.visibility === 'draft').length,
    ready: tournaments.filter(t => t.visibility === 'ready').length,
    live: tournaments.filter(t => t.visibility === 'live').length,
    archived: tournaments.filter(t => t.visibility === 'archived').length,
    undefined: tournaments.filter(t => !t.visibility).length
  };
  
  console.log('\n📈 Visibility Summary:');
  console.log(`Draft: ${visibilityStats.draft}, Ready: ${visibilityStats.ready}, Live: ${visibilityStats.live}, Archived: ${visibilityStats.archived}, Undefined: ${visibilityStats.undefined}`);
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });