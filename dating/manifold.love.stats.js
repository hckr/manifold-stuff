async function getUsers() {
  const select = '*';
  const order = 'created_time.asc';
  const limit = 1000;
  let lastCreatedTime = '1970-01-01T00:00:00Z+00:00';
  const users = [];
  do {
    const result = await fetch(
      `https://pxidrgkatumlvfqaxcll.supabase.co/rest/v1/lovers?${new URLSearchParams(
        {
          select,
          order,
          limit,
          created_time: `gt.${lastCreatedTime}`,
        }
      )}`,
      {
        headers: {
          apikey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aWRyZ2thdHVtbHZmcWF4Y2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njg5OTUzOTgsImV4cCI6MTk4NDU3MTM5OH0.d_yYtASLzAoIIGdXUBIgRAGLBnNow7JG2SoaNMQ8ySg',
        },
        body: null,
        method: 'GET',
      }
    );
    const newUsers = await result.json();
    if (newUsers.length === 0) {
      break;
    }
    lastCreatedTime = newUsers[newUsers.length - 1].created_time;
    users.push(...newUsers);
  } while (true);
  return users;
}

function countBy(field, arr) {
  const agg = new Map();
  for (const obj of arr) {
    agg.set(obj[field], (agg.get(obj[field]) || 0) + 1);
  }
  return agg;
}

function countByInArray(array_field, arr) {
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

function isCisHetOnly(user) {
  return (
    user.pref_gender.length === 1 &&
    [user.gender, user.pref_gender].sort().toString() == 'female,male'
  );
}

function hasSingleRelationStyle(user) {
  return user.pref_relation_styles.length === 1;
}

function isStrictlyMono(user) {
  return hasSingleRelationStyle(user) && user.pref_relation_styles[0] == 'mono';
}

function equals(field, value) {
  return (user) => user[field] == value;
}

function mapMapKeys(map, fun) {
  return new Map(Array.from(map).map(([k, v]) => [fun(k), v]));
}

/**
 *
 * @param {string} field
 * @param {Map<string, number>} map
 */
function countedToTable(field, map, total_sum) {
  const table = document.createElement('table');
  table.innerHTML = `<tr><th>${field}</th><th>count</th><th>% users</th></tr>
    ${Array.from(map)
      .sort(([ak, av], [bk, bv]) =>
        bv === av ? ak.localeCompare(bk) : bv - av
      )
      .map(
        ([k, v]) =>
          `<tr><td>${k}</td><td>${v}</td><td>${((v / total_sum) * 100).toFixed(
            1
          )}%</td></tr>`
      )
      .join('')}`;
  return table;
}

function text(text) {
  const node = document.createElement('div');
  node.innerText = text;
  node.className = 'text-container';
  return node;
}

(async function () {
  const textContainer = document.querySelector('.text-container');
  const statsContainer = document.querySelector('.stats-container');
  const users = await getUsers();
  const userCount = users.length;
  textContainer.appendChild(text(`Number of user profiles: ${users.length}`));
  statsContainer.appendChild(
    countedToTable('gender', countBy('gender', users), userCount)
  );
  statsContainer.appendChild(
    countedToTable(
      'preferred gender',
      countByInArray('pref_gender', users),
      userCount
    )
  );
  statsContainer.appendChild(
    countedToTable(
      'political beliefs',
      countByInArray('political_beliefs', users),
      userCount
    )
  );
  statsContainer.appendChild(
    countedToTable(
      'education_level',
      countBy('education_level', users),
      userCount
    )
  );
  statsContainer.appendChild(
    countedToTable(
      'preferred relations',
      countByInArray('pref_relation_styles', users),
      userCount
    )
  );
  const usersWithSingleRelationStyle = users.filter(hasSingleRelationStyle);
  statsContainer.appendChild(
    countedToTable(
      'preferred relations',
      mapMapKeys(
        countByInArray('pref_relation_styles', usersWithSingleRelationStyle),
        (key) => `only ${key}`
      ),
      userCount
    )
  );
  statsContainer.appendChild(
    countedToTable(
      'wants kids',
      mapMapKeys(
        countBy('wants_kids_strength', users),
        (strength) =>
          [
            'definite no',
            'leaning no',
            'neutral',
            'leaning yes',
            'definite yes',
          ][strength]
      ),
      userCount
    )
  );

  const cisHetOnly = users.filter(isCisHetOnly);
  const cisHetOnlyFemales = cisHetOnly.filter(equals('gender', 'female'));
  const cisHetOnlyMales = cisHetOnly.filter(equals('gender', 'male'));
  const cisHetOnlyMonoFemales = cisHetOnlyFemales.filter(isStrictlyMono);
  const cisHetOnlyMonoMales = cisHetOnlyMales.filter(isStrictlyMono);
  statsContainer.appendChild(
    countedToTable(
      'users with strict preference',
      new Map([
        ['cis-hetero females', cisHetOnlyFemales.length],
        ['cis-hetero males', cisHetOnlyMales.length],
        ['cis-hetero monogamous females', cisHetOnlyMonoFemales.length],
        ['cis-hetero monogamous males', cisHetOnlyMonoMales.length],
      ]),
      userCount
    )
  );

  statsContainer.appendChild(
    countedToTable('country', countBy('country', users), userCount)
  );
})();
