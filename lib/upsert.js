export function upsertOrder(orders, updated) {
    if (!Array.isArray(orders)) orders = [];
    if (!updated) return orders;

    const id = updated._id || updated.orderRef;
    if (!id) return orders;

    const next = orders.slice();
    const i = next.findIndex(o => (o?._id || o?.orderRef) === id);

    if (i >= 0) next[i] = { ...next[i], ...updated }; // merge in place
    else next.unshift(updated);                       // add new at the front

    return next;
}