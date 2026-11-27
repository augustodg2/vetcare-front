import { dayAt } from "./dates";

const vet = (id, userId, name, cpf, crmv, deletedAt = null) => ({
  id,
  userId,
  cpf,
  crmv,
  createdAt: dayAt(-400, 9),
  deletedAt,
  user: { name },
});

export const vetStore = [
  vet("v1", "u4", "Dra. Camila Torres", "52998224725", "CRMV-SP 11234"),
  vet("v2", "u5", "Dr. Rafael Moura", "11144477735", "CRMV-SP 20987"),
  vet(
    "v3",
    "u6",
    "Dr. Henrique Sales",
    "39053344705",
    "CRMV-SP 33456",
    dayAt(-30, 18),
  ),
];

export const vetSummary = (id) => {
  const found = vetStore.find((v) => v.id === id);
  return { id: found.id, name: found.user.name };
};
