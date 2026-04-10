import type { Bucket as BucketType, VarType } from './gameLogic'
import Bucket from './Bucket'

interface Props {
  buckets: BucketType[]
  nearType: VarType | null
  flashBucket: { type: VarType; color: 'green' | 'red' } | null
  showKeyHints: boolean
  onRegisterRef: (type: VarType, el: HTMLDivElement | null) => void
}

export default function BucketRow({ buckets, nearType, flashBucket, showKeyHints, onRegisterRef }: Props) {
  return (
    <div className="bucket-row">
      {buckets.map(b => (
        <Bucket
          key={b.type}
          type={b.type}
          keyboardKey={b.keyboardKey}
          isNear={nearType === b.type}
          flashColor={flashBucket?.type === b.type ? flashBucket.color : null}
          showKeyHint={showKeyHints}
          onRegisterRef={onRegisterRef}
        />
      ))}
    </div>
  )
}
