type AddressCodeTabProps = { bytecode: string; assembly: string };
export const AddressCodeTab = ({ bytecode, assembly }: AddressCodeTabProps) => {
  const opcodes = Array.from(assembly.matchAll(/\w+( 0x[a-fA-F0-9]+)?/g))
    .map(item => item[0])
    .join("\n");
  return (
    <div className="mt-5 space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">Bytecode</h2>
        <div className="bqs-explorer-panel">
          <pre className="bqs-explorer-code">{bytecode}</pre>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Mã lệnh EVM</h2>
        <div className="bqs-explorer-panel">
          <pre className="bqs-explorer-code">{opcodes}</pre>
        </div>
      </section>
    </div>
  );
};
