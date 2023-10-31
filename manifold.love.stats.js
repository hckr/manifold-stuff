async function getUsers() {
  const result = await fetch(
    'https://pxidrgkatumlvfqaxcll.supabase.co/rest/v1/lovers?select=*',
    {
      headers: {
        apikey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aWRyZ2thdHVtbHZmcWF4Y2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njg5OTUzOTgsImV4cCI6MTk4NDU3MTM5OH0.d_yYtASLzAoIIGdXUBIgRAGLBnNow7JG2SoaNMQ8ySg',
      },
      body: null,
      method: 'GET',
    }
  );
  return result.json();
}

function groupBy(field, arr) {
  const agg = new Map();
  for (const obj of arr) {
    agg.set(obj[field], (agg.get(obj[field]) || 0) + 1);
  }
  return agg;
}

function groupByInArray(array_field, arr) {
  const agg = new Map();
  for (const obj of arr) {
    if (!obj[array_field]) {
      continue;
    }
    for (const el of obj[array_field]) {
      agg.set(el, (agg.get(el) || 0) + 1);
    }
  }
  return agg;
}

function filterCisHetInclusive(users) {
  return users.filter(
    (u) => [u.gender, u.pref_gender].sort().toString() == 'female,male'
  );
}

function isCisHetOnly(user) {
  return (
    user.pref_gender.length === 1 &&
    [user.gender, user.pref_gender].sort().toString() == 'female,male'
  );
}

function equals(field, value) {
  return (user) => user[field] == value;
}

/**
 *
 * @param {string} field
 * @param {Map<string, number>} map
 */
function countedToTable(field, map) {
  const table = document.createElement('table');
  table.innerHTML = `<tr><th>${field}</th><th>count</th></tr>
    ${Array.from(map)
      .sort(([_ak, av], [_bk, bv]) => bv - av)
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join('')}`;
  return table;
}

(async function () {
  const container = document.querySelector('.manifold-love-container');
  const users = await getUsers();
  // console.log(users);
  container.appendChild(countedToTable('gender', groupBy('gender', users)));
  container.appendChild(
    countedToTable('pref_gender', groupByInArray('pref_gender', users))
  );
  container.appendChild(
    countedToTable(
      'political_beliefs',
      groupByInArray('political_beliefs', users)
    )
  );

  const cishetonly = users.filter(isCisHetOnly);
  console.log(cishetonly);
  console.log(
    cishetonly.filter(
      (u) =>
        u.pref_relation_styles.length === 1 &&
        u.pref_relation_styles[0] == 'mono'
    )
  );
  console.log(cishetonly.filter(equals('gender', 'female')));
  console.log(cishetonly.filter(equals('gender', 'male')));
})();
