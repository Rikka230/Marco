import { useContentDoc } from '../content';
import { SaveBar, Field, ChipsEditor, RowHead, move } from '../components/editor-bits';
import type { BookingOffer } from '../types';

export default function BookingContent() {
  const { data, update, save, loading, saving, dirty } = useContentDoc('booking');
  if (loading || !data) return <div className="spinner-page">Chargement…</div>;

  const setOffers = (offers: BookingOffer[]) => update({ ...data, offers });
  const patch = (i: number, p: Partial<BookingOffer>) =>
    setOffers(data.offers.map((o, j) => (j === i ? { ...o, ...p } : o)));

  return (
    <>
      <SaveBar title="Booking — contenu" dirty={dirty} saving={saving} onSave={save} />
      <div className="content">
        <div className="panel">
          <p className="panel-title">Offres / prestations</p>
          {data.offers.map((o, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={i + 1}
                onUp={() => setOffers(move(data.offers, i, i - 1))}
                onDown={() => setOffers(move(data.offers, i, i + 1))}
                onRemove={() => setOffers(data.offers.filter((_, j) => j !== i))} />
              <Field label="Intitulé" value={o.k} onChange={(v) => patch(i, { k: v })} />
              <div className="row">
                <Field label="Détail" value={o.meta} onChange={(v) => patch(i, { meta: v })} />
                <Field label="Statut" value={o.stat} onChange={(v) => patch(i, { stat: v })} />
              </div>
            </div>
          ))}
          <button className="btn" onClick={() => setOffers([...data.offers, { k: '', meta: '', stat: '' }])}>
            + Ajouter une offre
          </button>
        </div>

        <div className="panel">
          <p className="panel-title">Types de demande (chips du formulaire)</p>
          <ChipsEditor values={data.requestTypes} onChange={(requestTypes) => update({ ...data, requestTypes })} />
        </div>
      </div>
    </>
  );
}
