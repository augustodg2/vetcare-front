import { Skeleton, Stack } from "@mantine/core";
import { Block, LoadingRows } from "@/components/ui";
import headStyles from "./PetHeader.module.css";
import styles from "./Pet.module.css";

export function PetSkeleton() {
  return (
    <>
      <Block flush className={headStyles.petHead}>
        <div className={headStyles.petHeadMain}>
          <Skeleton height={56} width={56} radius="md" />
          <Stack gap={8} style={{ flex: 1 }}>
            <Skeleton height={22} width={160} />
            <Skeleton height={14} width={260} />
          </Stack>
        </div>
      </Block>
      <div className={styles.gridAside}>
        <Block flush>
          <LoadingRows rows={6} />
        </Block>
        <Block flush>
          <LoadingRows rows={4} />
        </Block>
      </div>
    </>
  );
}
