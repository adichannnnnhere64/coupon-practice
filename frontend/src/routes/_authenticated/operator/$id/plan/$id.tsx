import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/operator/$id/plan/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/operator/$id/plan/$id"!</div>
}
