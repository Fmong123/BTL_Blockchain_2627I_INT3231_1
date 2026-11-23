import { expect } from "chai";
import { network } from "hardhat";

const { networkHelpers, ethers } = await network.create();
const fileHash = ethers.sha256(ethers.toUtf8Bytes("licensed work"));
const otherHash = ethers.sha256(ethers.toUtf8Bytes("another licensed work"));

async function registeredFixture() {
  const [admin, registrant, licensee, other] = await ethers.getSigners();
  const registry = await ethers.deployContract("WorkRegistry", [admin.address]);
  await registry.waitForDeployment();
  await registry.connect(registrant).registerWork(fileHash, "Licensed work", "", 0);
  const expiresAt = BigInt(await networkHelpers.time.latest()) + 3600n;
  return { registry, admin, registrant, licensee, other, expiresAt };
}

async function licensedFixture() {
  const fixture = await registeredFixture();
  await fixture.registry
    .connect(fixture.registrant)
    .grantLicense(fileHash, fixture.licensee.address, fixture.expiresAt);
  return fixture;
}

describe("WorkRegistry licenses", function () {
  it("Allocates ID 1, records the exact license tuple and emits the grant data", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(registeredFixture);
    expect(await registry.licenseCount()).to.equal(0n);
    expect(await registry.connect(registrant).grantLicense.staticCall(fileHash, licensee.address, expiresAt)).to.equal(
      1n,
    );
    const tx = await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    expect(await registry.licenses(1n)).to.deep.equal([
      fileHash,
      registrant.address,
      licensee.address,
      BigInt(block!.timestamp),
      expiresAt,
      false,
    ]);
    expect(await registry.licenseCount()).to.equal(1n);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(1n);
    expect(await registry.isLicenseValid(1n)).to.equal(true);
    await expect(tx)
      .to.emit(registry, "LicenseGranted")
      .withArgs(1n, fileHash, licensee.address, registrant.address, block!.timestamp, expiresAt);
  });

  it("Rejects grants for an unregistered work", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(registeredFixture);
    await expect(registry.connect(registrant).grantLicense(otherHash, licensee.address, expiresAt))
      .to.be.revertedWithCustomError(registry, "WorkNotRegistered")
      .withArgs(otherHash);
    expect(await registry.licenseCount()).to.equal(0n);
  });

  it("Restricts grants to the registrant, including when the caller is admin", async function () {
    const { registry, admin, other, licensee, expiresAt } = await networkHelpers.loadFixture(registeredFixture);
    for (const caller of [admin, other, licensee]) {
      await expect(registry.connect(caller).grantLicense(fileHash, licensee.address, expiresAt))
        .to.be.revertedWithCustomError(registry, "NotWorkRegistrant")
        .withArgs(caller.address);
    }
    expect(await registry.licenseCount()).to.equal(0n);
  });

  it("Rejects the zero address and the registrant as licensees", async function () {
    const { registry, registrant, expiresAt } = await networkHelpers.loadFixture(registeredFixture);
    for (const address of [ethers.ZeroAddress, registrant.address]) {
      await expect(registry.connect(registrant).grantLicense(fileHash, address, expiresAt))
        .to.be.revertedWithCustomError(registry, "InvalidLicensee")
        .withArgs(address);
    }
    expect(await registry.licenseCount()).to.equal(0n);
  });

  it("Rejects an expiration in the past or at the transaction timestamp", async function () {
    const { registry, registrant, licensee } = await networkHelpers.loadFixture(registeredFixture);
    const current = BigInt(await networkHelpers.time.latest());
    await expect(registry.connect(registrant).grantLicense(fileHash, licensee.address, current - 1n))
      .to.be.revertedWithCustomError(registry, "InvalidExpiration")
      .withArgs(current - 1n);
    const next = BigInt(await networkHelpers.time.latest()) + 10n;
    await networkHelpers.time.setNextBlockTimestamp(next);
    await expect(registry.connect(registrant).grantLicense(fileHash, licensee.address, next))
      .to.be.revertedWithCustomError(registry, "InvalidExpiration")
      .withArgs(next);
    expect(await registry.licenseCount()).to.equal(0n);
  });

  it("Accepts a license that expires one second after its grant block", async function () {
    const { registry, registrant, licensee } = await networkHelpers.loadFixture(registeredFixture);
    const grantedAt = BigInt(await networkHelpers.time.latest()) + 10n;
    await networkHelpers.time.setNextBlockTimestamp(grantedAt);
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, grantedAt + 1n);
    expect(await registry.isLicenseValid(1n)).to.equal(true);
  });

  it("Rejects a second active license without changing the original record", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    const original = await registry.licenses(1n);
    await expect(registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt + 1n))
      .to.be.revertedWithCustomError(registry, "ActiveLicenseExists")
      .withArgs(1n);
    expect(await registry.licenseCount()).to.equal(1n);
    expect(await registry.licenses(1n)).to.deep.equal(original);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(1n);
  });

  it("Checks validity immediately before, exactly at and after expiration", async function () {
    const { registry, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    expect(await registry.isLicenseValid(0n)).to.equal(false);
    expect(await registry.isLicenseValid(2n)).to.equal(false);
    await networkHelpers.time.increaseTo(expiresAt - 1n);
    expect(await registry.isLicenseValid(1n)).to.equal(true);
    await networkHelpers.time.increaseTo(expiresAt);
    expect(await registry.isLicenseValid(1n)).to.equal(false);
    await networkHelpers.time.increaseTo(expiresAt + 1n);
    expect(await registry.isLicenseValid(1n)).to.equal(false);
  });

  it("Issues a new ID at the exact expiration boundary and preserves the expired record", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    const original = await registry.licenses(1n);
    await networkHelpers.time.setNextBlockTimestamp(expiresAt);
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt + 3600n);
    expect(await registry.licenseCount()).to.equal(2n);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(2n);
    expect(await registry.licenses(1n)).to.deep.equal(original);
    expect(await registry.isLicenseValid(1n)).to.equal(false);
    expect(await registry.isLicenseValid(2n)).to.equal(true);
  });

  it("Restricts revocation to the registrant with no licensee or admin bypass", async function () {
    const { registry, admin, licensee, other } = await networkHelpers.loadFixture(licensedFixture);
    for (const caller of [admin, licensee, other]) {
      await expect(registry.connect(caller).revokeLicense(1n))
        .to.be.revertedWithCustomError(registry, "NotWorkRegistrant")
        .withArgs(caller.address);
    }
    expect(await registry.isLicenseValid(1n)).to.equal(true);
  });

  it("Revokes with a timestamped event and rejects a repeated revocation", async function () {
    const { registry, registrant, licensee } = await networkHelpers.loadFixture(licensedFixture);
    const original = await registry.licenses(1n);
    const tx = await registry.connect(registrant).revokeLicense(1n);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    await expect(tx).to.emit(registry, "LicenseRevoked").withArgs(1n, fileHash, licensee.address, block!.timestamp);
    expect(await registry.licenses(1n)).to.deep.equal([...original.slice(0, 5), true]);
    expect(await registry.isLicenseValid(1n)).to.equal(false);
    await expect(registry.connect(registrant).revokeLicense(1n))
      .to.be.revertedWithCustomError(registry, "LicenseAlreadyRevoked")
      .withArgs(1n);
  });

  it("Rejects nonexistent license IDs, including zero", async function () {
    const { registry, registrant } = await networkHelpers.loadFixture(licensedFixture);
    for (const id of [0n, 2n]) {
      await expect(registry.connect(registrant).revokeLicense(id))
        .to.be.revertedWithCustomError(registry, "LicenseNotFound")
        .withArgs(id);
    }
  });

  it("Issues fresh IDs after revocation and keeps all prior license history", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    await registry.connect(registrant).revokeLicense(1n);
    const first = await registry.licenses(1n);
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt + 100n);
    await registry.connect(registrant).revokeLicense(2n);
    const second = await registry.licenses(2n);
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt + 200n);
    expect(await registry.licenseCount()).to.equal(3n);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(3n);
    expect(await registry.licenses(1n)).to.deep.equal(first);
    expect(await registry.licenses(2n)).to.deep.equal(second);
    expect(await registry.isLicenseValid(3n)).to.equal(true);
  });

  it("Tracks active licenses independently for each work and recipient", async function () {
    const { registry, registrant, licensee, other, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    await registry.connect(registrant).registerWork(otherHash, "Second work", "", 2);
    await registry.connect(registrant).grantLicense(fileHash, other.address, expiresAt);
    await registry.connect(registrant).grantLicense(otherHash, licensee.address, expiresAt);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(1n);
    expect(await registry.latestLicenseId(fileHash, other.address)).to.equal(2n);
    expect(await registry.latestLicenseId(otherHash, licensee.address)).to.equal(3n);
    expect(await registry.latestLicenseId(otherHash, other.address)).to.equal(0n);
    await registry.connect(registrant).revokeLicense(1n);
    expect(await registry.isLicenseValid(2n)).to.equal(true);
    expect(await registry.isLicenseValid(3n)).to.equal(true);
  });

  it("Blocks grants while paused, permits reads and revocation, then resumes grants", async function () {
    const { registry, registrant, licensee, other, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    await registry.pause();
    await expect(
      registry.connect(registrant).grantLicense(fileHash, other.address, expiresAt),
    ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    expect(await registry.isLicenseValid(1n)).to.equal(true);
    expect((await registry.licenses(1n)).licensee).to.equal(licensee.address);
    await registry.connect(registrant).revokeLicense(1n);
    expect(await registry.isLicenseValid(1n)).to.equal(false);
    await registry.unpause();
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt);
    expect(await registry.isLicenseValid(2n)).to.equal(true);
  });

  it("Allows revocation of an expired license even while paused without changing a newer license", async function () {
    const { registry, registrant, licensee, expiresAt } = await networkHelpers.loadFixture(licensedFixture);
    await networkHelpers.time.increaseTo(expiresAt);
    await registry.connect(registrant).grantLicense(fileHash, licensee.address, expiresAt + 3600n);
    await registry.pause();
    await registry.connect(registrant).revokeLicense(1n);
    expect((await registry.licenses(1n)).revoked).to.equal(true);
    expect(await registry.latestLicenseId(fileHash, licensee.address)).to.equal(2n);
    expect(await registry.isLicenseValid(2n)).to.equal(true);
    await expect(registry.connect(registrant).revokeLicense(1n))
      .to.be.revertedWithCustomError(registry, "LicenseAlreadyRevoked")
      .withArgs(1n);
  });
});
