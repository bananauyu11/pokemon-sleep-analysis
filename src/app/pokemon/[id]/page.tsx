import EditClient from './EditClient';

export default async function EditPokemonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditClient id={id} />;
}
