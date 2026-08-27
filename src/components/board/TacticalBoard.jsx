import { useCallback, useEffect, useRef, useState } from 'react'
import BoardToolbar from './BoardToolbar'
import { drawPitch } from './pitch'
import { drawArrow, drawObject, hitArrow, hitObject } from './boardDraw'

const EMPTY = { objects: [], arrows: [] }
const MAX_HISTORY = 30

export default function TacticalBoard({ value, onChange }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const dragRef = useRef(null)

  const [data, setData] = useState(() => value ?? EMPTY)
  const [tool, setTool] = useState('select')
  const [draft, setDraft] = useState(null) // βέλος που σχεδιάζεται αυτή τη στιγμή
  const [history, setHistory] = useState([])

  // ----------------------------------------------------------
  // Σχεδίαση
  // ----------------------------------------------------------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    drawPitch(ctx, rect.width, rect.height)
    data.arrows.forEach((arrow) => drawArrow(ctx, arrow, rect.width, rect.height))
    if (draft) drawArrow(ctx, draft, rect.width, rect.height)
    data.objects.forEach((obj) => drawObject(ctx, obj, rect.width, rect.height))
  }, [data, draft])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    const observer = new ResizeObserver(() => redraw())
    if (wrapRef.current) observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [redraw])

  // ----------------------------------------------------------
  // Κατάσταση
  // ----------------------------------------------------------
  const commit = useCallback(
    (next, pushHistory = true) => {
      if (pushHistory) {
        setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), data])
      }
      setData(next)
      onChange?.(next)
    },
    [data, onChange],
  )

  function undo() {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setData(last)
      onChange?.(last)
      return prev.slice(0, -1)
    })
  }

  function clearAll() {
    commit(EMPTY)
  }

  // ----------------------------------------------------------
  // Χειρισμός με Pointer Events (ένας κώδικας για ποντίκι και αφή)
  // ----------------------------------------------------------
  function positionOf(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height,
      w: rect.width,
      h: rect.height,
    }
  }

  function nextLabel(team) {
    return data.objects.filter((o) => o.type === 'player' && o.team === team).length + 1
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const { px, py, nx, ny, w, h } = positionOf(e)

    if (tool === 'select') {
      const index = hitObject(data.objects, px, py, w, h)
      if (index !== -1) {
        dragRef.current = {
          index,
          dx: data.objects[index].x - nx,
          dy: data.objects[index].y - ny,
          moved: false,
          before: data,
        }
      }
      return
    }

    if (tool === 'erase') {
      const objectIndex = hitObject(data.objects, px, py, w, h)
      if (objectIndex !== -1) {
        commit({ ...data, objects: data.objects.filter((_, i) => i !== objectIndex) })
        return
      }
      const arrowIndex = hitArrow(data.arrows, px, py, w, h)
      if (arrowIndex !== -1) {
        commit({ ...data, arrows: data.arrows.filter((_, i) => i !== arrowIndex) })
      }
      return
    }

    if (tool === 'run' || tool === 'pass') {
      setDraft({ id: crypto.randomUUID(), kind: tool, points: [{ x: nx, y: ny }] })
      return
    }

    // Εργαλεία τοποθέτησης
    const team = tool === 'player-red' ? 'red' : 'blue'
    const object =
      tool === 'cone'
        ? { id: crypto.randomUUID(), type: 'cone', x: nx, y: ny }
        : tool === 'ball'
          ? { id: crypto.randomUUID(), type: 'ball', x: nx, y: ny }
          : { id: crypto.randomUUID(), type: 'player', team, label: nextLabel(team), x: nx, y: ny }

    commit({ ...data, objects: [...data.objects, object] })
  }

  function onPointerMove(e) {
    const drag = dragRef.current
    const { nx, ny } = positionOf(e)

    if (drag) {
      const objects = [...data.objects]
      objects[drag.index] = {
        ...objects[drag.index],
        x: Math.min(1, Math.max(0, nx + drag.dx)),
        y: Math.min(1, Math.max(0, ny + drag.dy)),
      }
      drag.moved = true
      setData({ ...data, objects }) // χωρίς ιστορικό όσο σέρνουμε
      return
    }

    if (draft) {
      const last = draft.points[draft.points.length - 1]
      // Δείγματα κάθε ~1.5% της διάστασης, για ομαλή αλλά ελαφριά γραμμή
      if (Math.hypot(nx - last.x, ny - last.y) > 0.015) {
        setDraft({ ...draft, points: [...draft.points, { x: nx, y: ny }] })
      }
    }
  }

  function onPointerUp() {
    const drag = dragRef.current
    if (drag) {
      dragRef.current = null
      if (drag.moved) {
        setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), drag.before])
        onChange?.(data)
      }
      return
    }

    if (draft) {
      if (draft.points.length > 1) {
        commit({ ...data, arrows: [...data.arrows, draft] })
      }
      setDraft(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="board-canvas w-full rounded-2xl border border-line"
          style={{ aspectRatio: '2 / 3' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      <BoardToolbar
        tool={tool}
        onTool={setTool}
        onUndo={undo}
        onClear={clearAll}
        canUndo={history.length > 0}
      />
    </div>
  )
}
