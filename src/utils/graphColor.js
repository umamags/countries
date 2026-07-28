const DEFAULT_COLOR_COUNT = 4

// DSATUR graph coloring: repeatedly color the node with the most distinct
// colors already among its neighbors (breaking ties by degree), always
// picking its lowest available color. This guarantees no two adjacent
// nodes ever share a color - the same guarantee real political maps rely
// on (four-color theorem) - unlike an independently-chosen color per node
// (e.g. hashed from a name), which has no such guarantee and can't be
// validated for colorblind-safety once any two nodes could end up adjacent.
// Returns an int array (index -> color 0..numColors-1, or -1 if a node
// couldn't be colored within the budget - render that as neutral rather
// than reusing a neighbor's color and breaking the adjacency guarantee).
export function colorGraph(n, neighborLists, numColors = DEFAULT_COLOR_COUNT) {
  const color = new Array(n).fill(-1)
  const neighborColors = Array.from({ length: n }, () => new Set())
  const uncolored = new Set(Array.from({ length: n }, (_, i) => i))

  while (uncolored.size > 0) {
    let best = -1
    let bestSaturation = -1
    let bestDegree = -1
    for (const i of uncolored) {
      const saturation = neighborColors[i].size
      const degree = neighborLists[i].length
      if (saturation > bestSaturation || (saturation === bestSaturation && degree > bestDegree)) {
        best = i
        bestSaturation = saturation
        bestDegree = degree
      }
    }

    const used = neighborColors[best]
    let c = 0
    while (used.has(c) && c < numColors) c++
    color[best] = c < numColors ? c : -1
    uncolored.delete(best)
    if (color[best] >= 0) {
      for (const j of neighborLists[best]) neighborColors[j].add(color[best])
    }
  }

  return color
}
