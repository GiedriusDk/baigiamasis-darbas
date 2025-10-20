import { useEffect, useMemo, useState } from 'react'
import {
  Card, Text, Title, Group, SimpleGrid, Image, Loader, Center,
  MultiSelect, TextInput, Button, Pagination, Stack, Badge
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getExercises, getFilters } from '../api'
import ExerciseDetailsModal from '../components/ExerciseDetailsModal.jsx'

const PER_PAGE = 24

export default function ExercisesPage() {
  const [list, setList]   = useState([])
  const [meta, setMeta]   = useState({ page: 1, perPage: PER_PAGE, total: 0, lastPage: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({ equipments: [], muscles: [] })
  const [q, setQ] = useState('')
  const [equipments, setEquipments] = useState([])
  const [muscles, setMuscles]       = useState([])

  const [page, setPage] = useState(1)
  const [qDebounced] = useDebouncedValue(q, 350)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsEx, setDetailsEx]     = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const f = await getFilters()
        setFilters(f)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true); setError(null)

    getExercises({
      page,
      per_page: PER_PAGE,
      q: qDebounced || '',
      equipment: equipments.length ? equipments.join(',') : '',
      muscles: muscles.length ? muscles.join(',') : '',
    })
      .then((res) => {
        if (ignore) return
        setList(res.data || [])
        setMeta(res.meta || { page: 1, perPage: PER_PAGE, total: 0, lastPage: 1 })
      })
      .catch((e) => { if (!ignore) setError(e.message || 'Failed to load data') })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [page, qDebounced, equipments, muscles])

  function clearFilters() {
    setEquipments([])
    setMuscles([])
    setQ('')
    setPage(1)
  }

  const equipmentData = useMemo(
    () => filters.equipments?.map((x) => ({ value: x, label: x })) ?? [],
    [filters.equipments]
  )
  const muscleData = useMemo(
    () => filters.muscles?.map((x) => ({ value: x, label: x })) ?? [],
    [filters.muscles]
  )

  return (
    <Stack gap="lg">
      <Title order={2}>Exercises</Title>

      {/* Filters */}
      <Group align="end" wrap="wrap" gap="md">
        <TextInput
          label="Search"
          placeholder="e.g. squat"
          value={q}
          onChange={(e) => { setQ(e.currentTarget.value); setPage(1) }}
          style={{ minWidth: 240 }}
        />

        <MultiSelect
          label="Equipment (multiple)"
          placeholder="Pick…"
          data={equipmentData}
          value={equipments}
          onChange={(vals) => { setEquipments(vals); setPage(1) }}
          searchable
          clearable
          style={{ minWidth: 320 }}
          hidePickedOptions
        />

        <MultiSelect
          label="Muscles (multiple)"
          placeholder="Pick…"
          data={muscleData}
          value={muscles}
          onChange={(vals) => { setMuscles(vals); setPage(1) }}
          searchable
          clearable
          style={{ minWidth: 320 }}
          hidePickedOptions
        />

        <Button variant="subtle" onClick={clearFilters}>Clear filters</Button>
      </Group>

      {Boolean(q || equipments.length || muscles.length) && (
        <Group gap="xs">
          {q && <Badge color="gray" variant="light">search: “{q}”</Badge>}
          {equipments.map((e) => (
            <Badge key={`eq-${e}`} variant="outline" color="blue">{e}</Badge>
          ))}
          {muscles.map((m) => (
            <Badge key={`m-${m}`} variant="filled" color="blue">{m}</Badge>
          ))}
        </Group>
      )}

      {loading && <Center mih={200}><Loader /></Center>}
      {!loading && error && <Center mih={200}><Text c="red">{error}</Text></Center>}
      {!loading && !error && list.length === 0 && (
        <Center mih={200}><Text c="dimmed">Nothing found…</Text></Center>
      )}

      {!loading && !error && list.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {list.map((ex) => (
              <Card
                key={ex.id}
                withBorder
                radius="lg"
                padding="md"
                shadow="sm"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setDetailsEx(ex);
                  setDetailsOpen(true);
                }}
              >
                <div style={{
                  height: 180, background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', borderRadius: 12,
                }}>
                  <Image
                    src={ex.image_url}
                    alt={ex.name}
                    height={180}
                    fit="contain"
                    styles={{ image: { objectFit: 'contain' } }}
                  />
                </div>

                <Text fw={600} mt="sm" lineClamp={2}>{ex.name}</Text>
                <Group gap={6} mt={6}>
                  {ex.primary_muscle && <Badge variant="filled">{ex.primary_muscle}</Badge>}
                  {ex.equipment && <Badge variant="outline">{ex.equipment}</Badge>}
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <ExerciseDetailsModal
            opened={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            exercise={detailsEx?.name ? detailsEx : null}
            exerciseId={!detailsEx?.name ? detailsEx?.id : null}
          />

          <Group justify="space-between" mt="lg">
            <Text c="dimmed" size="sm">
              Showing {(meta.page - 1) * meta.perPage + 1}–{Math.min(meta.page * meta.perPage, meta.total)} of {meta.total}
            </Text>
            <Pagination total={meta.lastPage || 1} value={meta.page} onChange={setPage} />
          </Group>
        </>
      )}
    </Stack>
  )
}