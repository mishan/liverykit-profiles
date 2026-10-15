# liverykit-profiles

Car profiles for [liverykit](https://github.com/mishan/liverykit), for the cars
that come with Assetto Corsa and its DLC.

A profile is what liverykit knows about a car: its paintable textures, the UV
islands on each, named and measured — where each lands on the bodywork, which
way it runs, how much of it can be seen from trackside and from the driver's
seat, which islands touch. It is generated from the car's `.kn5` by
`liverykit --from-kn5`. It holds no textures, meshes or other game assets: only
measurements, filenames and the car's display name.

## Using them

```sh
git clone https://github.com/mishan/liverykit-profiles
export LIVERYKIT_PROFILES="$PWD/liverykit-profiles/cars"
liverykit neon-grid-any --profile ks_ferrari_488_gt3
```

`--profiles <dir>` does the same as the variable for one run. liverykit looks
in `./cars/` first, then here, then among the profiles it bundles.

## What to trust

- **Measurements** — rectangles, outlines, visibility, adjacency, wheel layout
  — are exact or computed, and say which.
- **Bindings** say which texture is the body, the rims, the tires and so on.
  Every one here is `"source": "auto"`: the generator's proposal, right about
  98% of the time, and confirmed by nobody. liverykit reports it as such when
  it paints through one. Check it in the editor's Bindings panel and send the
  confirmation back; the two bundled with liverykit, `abarth500` and
  `tatuusfa1`, are confirmed and copied from it.
- **Outlines** are simplified to at most 32 points. They clip artwork to an
  island; they are not a livery template.

Each profile records the size and SHA-256 of the model it was measured from,
and liverykit says so if your copy of the car differs. A car updated since is
regenerated with `node generate.mjs`.

## Regenerating

```sh
node generate.mjs <liverykit checkout> <assettocorsa>/content/cars [carId ...]
```

Only Kunos's own cars are generated. A profile of a mod car is a measurement
of its author's work, and it is published here only with that author's
permission.

## License and notices

The profiles are dedicated to the public domain under [CC0 1.0](LICENSE).

Not affiliated with or endorsed by Kunos Simulazioni, any vehicle manufacturer,
or any mod author. Car and maker names are used only to identify the car a file
describes. If you made a car described here and want its profile removed, see
[TAKEDOWN.md](TAKEDOWN.md).
