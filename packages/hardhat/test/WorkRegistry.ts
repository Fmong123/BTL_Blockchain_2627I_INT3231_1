import { expect } from "chai";
import { network } from "hardhat";

const { networkHelpers, ethers } = await network.create();
const fileHash = ethers.sha256(ethers.toUtf8Bytes("copyright demo"));
const title = "Tác phẩm thử nghiệm";
const description = "Tác phẩm do nhóm tự tạo để trình diễn.";
const emptyWork = [ethers.ZeroAddress, 0n, "", "", 0n];

async function deployFixture() {
  const [admin, registrant, other] = await ethers.getSigners();
  const registry = await ethers.deployContract("WorkRegistry", [admin.address]);
  await registry.waitForDeployment();
  return { registry, admin, registrant, other };
}

describe("WorkRegistry", function () {
  for (const [workType, label] of ["Image", "Audio", "Document"].entries()) {
    it(`Records ${label} metadata, registering wallet, timestamp and event`, async function () {
      const { registry, registrant } = await networkHelpers.loadFixture(deployFixture);
      const tx = await registry.connect(registrant).registerWork(fileHash, title, description, workType);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      expect(await registry.works(fileHash)).to.deep.equal([
        registrant.address,
        BigInt(block!.timestamp),
        title,
        description,
        BigInt(workType),
      ]);
      await expect(tx).to.emit(registry, "WorkRegistered").withArgs(fileHash, registrant.address, block!.timestamp);
    });
  }

  it("Rejects duplicate hashes across wallets, titles and work types without overwriting the first record", async function () {
    const { registry, registrant, other } = await networkHelpers.loadFixture(deployFixture);
    await registry.connect(registrant).registerWork(fileHash, title, description, 0);
    const before = await registry.works(fileHash);
    await expect(registry.connect(registrant).registerWork(fileHash, "Different", "", 1)).to.be.revertedWith(
      "Already registered",
    );
    await expect(registry.connect(other).registerWork(fileHash, title, "", 2)).to.be.revertedWith("Already registered");
    expect(await registry.works(fileHash)).to.deep.equal(before);
  });

  it("Rejects an empty hash and returns an empty record for an unknown hash", async function () {
    const { registry } = await networkHelpers.loadFixture(deployFixture);
    expect(await registry.works(fileHash)).to.deep.equal(emptyWork);
    await expect(registry.registerWork(ethers.ZeroHash, title, "", 0)).to.be.revertedWith("Empty hash");
  });

  it("Enforces UTF-8 metadata limits and permits an optional description", async function () {
    const { registry } = await networkHelpers.loadFixture(deployFixture);
    const maxTitle = "ấ".repeat(85) + "a";
    const maxDescription = "đ".repeat(1024);
    expect(await registry.MAX_TITLE_BYTES()).to.equal(256n);
    expect(await registry.MAX_DESCRIPTION_BYTES()).to.equal(2048n);
    await expect(registry.registerWork(fileHash, "", "", 0)).to.be.revertedWith("Empty title");
    await expect(registry.registerWork(fileHash, maxTitle + "a", "", 0)).to.be.revertedWith("Title too long");
    await expect(registry.registerWork(fileHash, title, maxDescription + "a", 0)).to.be.revertedWith(
      "Description too long",
    );
    await registry.registerWork(fileHash, maxTitle, maxDescription, 0);
    expect((await registry.works(fileHash)).title).to.equal(maxTitle);
    const otherHash = ethers.sha256(ethers.toUtf8Bytes("another file"));
    await registry.registerWork(otherHash, title, "", 2);
    expect((await registry.works(otherHash)).description).to.equal("");
  });

  it("Rejects an unsupported work type", async function () {
    const { registry } = await networkHelpers.loadFixture(deployFixture);
    await expect(registry.registerWork(fileHash, title, "", 3)).to.revert(ethers);
    expect(await registry.works(fileHash)).to.deep.equal(emptyWork);
  });

  it("Restricts pause controls to the admin, keeps reads available and resumes registration", async function () {
    const { registry, registrant, other } = await networkHelpers.loadFixture(deployFixture);
    await expect(registry.connect(registrant).pause()).to.be.revertedWithCustomError(
      registry,
      "OwnableUnauthorizedAccount",
    );
    await registry.pause();
    await expect(registry.connect(registrant).registerWork(fileHash, title, "", 0)).to.be.revertedWithCustomError(
      registry,
      "EnforcedPause",
    );
    expect(await registry.connect(other).works(fileHash)).to.deep.equal(emptyWork);
    await expect(registry.connect(registrant).unpause()).to.be.revertedWithCustomError(
      registry,
      "OwnableUnauthorizedAccount",
    );
    await registry.unpause();
    await registry.connect(registrant).registerWork(fileHash, title, "", 0);
    expect((await registry.works(fileHash)).registrant).to.equal(registrant.address);
  });
});
