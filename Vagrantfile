if Vagrant::Util::Platform.windows? then
  def running_in_admin_mode?
    (`reg query HKU\\S-1-5-19 2>&1` =~ /ERROR/).nil?
  end
 
  unless running_in_admin_mode?
    puts "This vagrant makes use of SymLinks to the host. On Windows, Administrative privileges are required to create symlinks (mklink.exe). Try again from an Administrative command prompt."
    exit 1
  end
end
Vagrant.configure("2") do |config|
  config.vm.define "dapps" do |dapps|
    dapps.vm.box = "b9lab/eth20"
    dapps.vm.box_url = [
     "https://dst5e0zgbst3t.cloudfront.net/truffle-vagrant-eth-20-package.box",
     "https://b9-academy-assets.s3.amazonaws.com/9-Exam/boxes/truffle-vagrant-eth-20-package.box",
     "http://localhost:8080/ipfs/Qmcvx4zifnnW77cjkQPB498cCtyN7jKvhUSydBPaSJ92wp",
     "http://ipfs.b9lab.com:8080/ipfs/Qmcvx4zifnnW77cjkQPB498cCtyN7jKvhUSydBPaSJ92wp",
     "http://ipfs.io/ipfs/Qmcvx4zifnnW77cjkQPB498cCtyN7jKvhUSydBPaSJ92wp"
    ]
    config.vm.box_download_checksum = "a62a1133314df4b6e3afc3d92b1208a59733298ba39343a378ca34d6ccb980b4"
    config.vm.box_download_checksum_type = "sha256"
    # Change from "~/DAPPS" to an existing, and non-encrypted, folder on your host if the mount fails
    dapps.vm.synced_folder "D:/B9/exam-step-2", "/home/vagrant/DAPPS", nfs: true, nfs_udp: false, create: true
    dapps.vm.network "private_network", type: "dhcp"
    dapps.vm.network :forwarded_port, guest: 8000, host: 8000
    dapps.vm.network :forwarded_port, guest: 8545, host: 8545

    # IPFS
    dapps.vm.network :forwarded_port, guest: 4001, host: 4001
    dapps.vm.network :forwarded_port, guest: 5001, host: 5001
    dapps.vm.network :forwarded_port, guest: 8080, host: 8080

    dapps.vm.provider "virtualbox" do |v|
      host = RbConfig::CONFIG['host_os']

      # Give VM 1/5 system memory & access to all cpu cores on the host
      if host =~ /darwin/
        cpus = `sysctl -n hw.ncpu`.to_i
        # sysctl returns Bytes and we need to convert to MB
        # mem = `sysctl -n hw.memsize`.to_i / 1024 / 1024 / 2
        mem = 3572
      elsif host =~ /linux/
        cpus = `nproc`.to_i
        # meminfo shows KB and we need to convert to MB
        # mem = `grep 'MemTotal' /proc/meminfo | sed -e 's/MemTotal://' -e 's/ kB//'`.to_i / 1024 / 4
        mem = 3572
      else # sorry Windows folks, I can't help you
        cpus = 2
        mem = 3572
      end

      v.customize ["modifyvm", :id, "--memory", mem]
      v.customize ["modifyvm", :id, "--cpus", cpus]
      v.customize ["guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 1000]
    end

    dapps.vm.provision "file", source: "dotscreenrc", destination: "~/.screenrc"

    #dapps.vm.provision :shell, path: "bootstrap.sh"
  end
  config.ssh.password = "vagrant"
  config.ssh.insert_key = true
end
